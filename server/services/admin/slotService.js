import Slot from '../../models/Slot.js';
import Salon from '../../models/Salon.js';
import Staff from '../../models/Staff.js';
import { assertObjectId, buildError, normalizeString, sanitizeDocument, sanitizeDocuments } from './common.js';

const DEFAULT_SLOT_INTERVAL = 30;
const VALID_SLOT_STATUSES = new Set(['AVAILABLE', 'UNAVAILABLE', 'BOOKED', 'EXPIRED']);

const parseTimeToMinutes = (value = '') => {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  const normalized = text.toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3] || '';

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const formatDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSlotDateTime = (slot = {}) => {
  const dateValue = String(slot.date || slot.slotDate || '').trim();
  const startTime = String(slot.start_time || slot.startTime || '').trim();
  const startMinutes = parseTimeToMinutes(startTime);

  if (!dateValue || startMinutes === null) {
    return null;
  }

  const slotDateTime = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(slotDateTime.getTime())) {
    return null;
  }

  slotDateTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  return slotDateTime;
};

const formatMinutesToTime = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours24 = Math.floor(safeMinutes / 60) % 24;
  const mins = String(safeMinutes % 60).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${mins} ${period}`;
};

const toDateTimeMinutes = (slot = {}) => {
  const startTime = String(slot.start_time || slot.startTime || '').trim();
  const dateValue = String(slot.date || slot.slotDate || '').trim();
  const startMinutes = parseTimeToMinutes(startTime);

  if (!dateValue || startMinutes === null) {
    return null;
  }

  return { dateValue, startMinutes };
};

export const computeSlotStatus = (slot = {}, now = new Date()) => {
  const rawStatus = String(slot.status || '').trim().toUpperCase();
  const dateValue = String(slot.date || slot.slotDate || '').trim();
  const today = formatDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const normalized = toDateTimeMinutes(slot);
  const isPast = Boolean(normalized) && (normalized.dateValue < today || (normalized.dateValue === today && normalized.startMinutes < currentMinutes));

  if (rawStatus === 'BOOKED' || slot.is_booked || slot.booking_id) {
    return 'BOOKED';
  }

  if (rawStatus === 'UNAVAILABLE' || rawStatus === 'BREAK' || slot.is_active === false) {
    return 'UNAVAILABLE';
  }

  if (isPast) {
    return 'EXPIRED';
  }

  if (rawStatus === 'EXPIRED' || (dateValue && normalized && normalized.dateValue < today)) {
    return 'EXPIRED';
  }

  return 'AVAILABLE';
};

export const normalizeSlotForResponse = (slot = {}, now = new Date()) => {
  const status = computeSlotStatus(slot, now);
  const slotDateTime = getSlotDateTime(slot);
  const rawStatus = String(slot.status || '').trim().toUpperCase();
  const manuallyDisabled = rawStatus === 'UNAVAILABLE' || rawStatus === 'BREAK' || slot.is_active === false;
  const isBooked = status === 'BOOKED';
  const isPast = status === 'EXPIRED';
  const available = !isBooked && !manuallyDisabled && !isPast;

  return {
    ...slot,
    time: slot.start_time || slot.startTime || slot.time || '',
    slotDateTime: slotDateTime ? slotDateTime.toISOString() : '',
    status,
    availabilityStatus: status,
    isBooked,
    isPast,
    manuallyDisabled,
    available,
    is_booked: isBooked,
    is_active: available,
    booking_id: isBooked ? slot.booking_id || '' : slot.booking_id || '',
  };
};

const getSalonSlotInterval = async () => {
  const salon = await Salon.findOne({ status: 'AA' }).select('slotTimings').lean();
  const interval = Number(salon?.slotTimings?.intervalMinutes || DEFAULT_SLOT_INTERVAL);
  return Number.isFinite(interval) && interval > 0 ? interval : DEFAULT_SLOT_INTERVAL;
};

const getDefaultSalonId = async () => {
  const salon = await Salon.findOne({ status: 'AA' }).select('_id').lean();
  return salon?._id || null;
};

const normalizeWorkingWindow = (staff = {}) => {
  const workingHours = staff.workingHours || {};
  const start = normalizeString(workingHours.start || workingHours.startTime || '').trim();
  const end = normalizeString(workingHours.end || workingHours.endTime || '').trim();
  return { start, end };
};

const buildGeneratedSlots = async ({ date, staffList = [] }) => {
  const intervalMinutes = await getSalonSlotInterval();
  const salonId = await getDefaultSalonId();
  const generated = [];

  for (const staff of staffList) {
    const { start, end } = normalizeWorkingWindow(staff);
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = parseTimeToMinutes(end);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      continue;
    }

    for (let current = startMinutes; current + intervalMinutes <= endMinutes; current += intervalMinutes) {
      generated.push({
        salon_id: salonId,
        stylist_id: staff._id,
        date,
        start_time: formatMinutesToTime(current),
        end_time: formatMinutesToTime(current + intervalMinutes),
        is_booked: false,
        is_active: true,
        status: 'AVAILABLE',
        booking_id: '',
        metadata: { generated: true },
      });
    }
  }

  return generated;
};

const ensureGeneratedSlotsForDate = async ({ date, stylistId = '' }) => {
  if (!date) {
    return;
  }

  const staffQuery = { status: 'AA' };
  if (stylistId) {
    staffQuery._id = stylistId;
  }

  const staffList = await Staff.find(staffQuery).lean();
  if (!staffList.length) {
    return;
  }

  const generatedSlots = await buildGeneratedSlots({ date, staffList });

  if (!generatedSlots.length) {
    return;
  }

  const existing = await Slot.find({
    date,
    stylist_id: { $in: staffList.map((item) => item._id) },
  }).select('stylist_id start_time end_time').lean();

  const existingKeys = new Set(existing.map((slot) => `${String(slot.stylist_id)}:${slot.start_time}:${slot.end_time}`));
  const toInsert = generatedSlots.filter((slot) => !existingKeys.has(`${String(slot.stylist_id)}:${slot.start_time}:${slot.end_time}`));

  if (toInsert.length) {
    await Slot.insertMany(toInsert, { ordered: false });
  }
};

const buildSlotPayload = (input = {}, fallback = {}) => {
  const salonId = input.salonId ?? input.salon_id ?? fallback.salonId ?? fallback.salon_id ?? '';
  const staffId = input.staffId ?? input.staff_id ?? input.stylist_id ?? fallback.staffId ?? fallback.staff_id ?? fallback.stylist_id ?? '';
  const date = normalizeString(input.date ?? fallback.date ?? '');
  const startTime = normalizeString(input.startTime ?? input.start_time ?? fallback.startTime ?? fallback.start_time ?? '');
  const endTime = normalizeString(input.endTime ?? input.end_time ?? fallback.endTime ?? fallback.end_time ?? '');
  const status = String(input.status ?? fallback.status ?? 'AVAILABLE').trim().toUpperCase() || 'AVAILABLE';

  if (!date || !startTime || !endTime) {
    throw buildError('Date, start time and end time are required.', 'INVALID_SLOT_PAYLOAD', 400);
  }

  return {
    salon_id: salonId ? assertObjectId(salonId, 'salonId') : null,
    stylist_id: staffId ? assertObjectId(staffId, 'staffId') : null,
    date,
    start_time: startTime,
    end_time: endTime,
    is_booked: status === 'BOOKED',
    is_active: status !== 'UNAVAILABLE',
    status: VALID_SLOT_STATUSES.has(status) ? status : 'AVAILABLE',
    booking_id: '',
    metadata: typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : {},
  };
};

const ensureSalonAndStaffExist = async (slotPayload) => {
  const salon = await Salon.findById(slotPayload.salon_id);
  if (!salon) {
    throw buildError('Salon not found.', 'SALON_NOT_FOUND', 404);
  }

  if (slotPayload.stylist_id) {
    const staff = await Staff.findById(slotPayload.stylist_id);
    if (!staff) {
      throw buildError('Staff not found.', 'STAFF_NOT_FOUND', 404);
    }
  }
};

export const createSlots = async (input = {}) => {
  const slotInputs = Array.isArray(input.slots) && input.slots.length ? input.slots : [input];
  const payloads = [];

  for (const slotInput of slotInputs) {
    const payload = buildSlotPayload(slotInput, input);
    await ensureSalonAndStaffExist(payload);
    payloads.push(payload);
  }

  const createdSlots = await Slot.insertMany(payloads);
  return sanitizeDocuments(createdSlots);
};

export const assignSlotToStaff = async (slotId, input = {}) => {
  assertObjectId(slotId, 'slotId');
  const staffId = assertObjectId(input.staffId ?? input.staff_id ?? input.stylist_id, 'staffId');
  const slot = await Slot.findById(slotId);

  if (!slot) {
    throw buildError('Slot not found.', 'SLOT_NOT_FOUND', 404);
  }

  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw buildError('Staff not found.', 'STAFF_NOT_FOUND', 404);
  }

  slot.stylist_id = staffId;
  if (input.salonId || input.salon_id) {
    slot.salon_id = assertObjectId(input.salonId ?? input.salon_id, 'salonId');
  }

  if (typeof input.isActive === 'boolean') {
    slot.is_active = input.isActive;
  }

  await slot.save();
  return sanitizeDocument(slot);
};

export const disableUnavailableSlot = async (slotId, input = {}) => {
  assertObjectId(slotId, 'slotId');
  const slot = await Slot.findById(slotId);

  if (!slot) {
    throw buildError('Slot not found.', 'SLOT_NOT_FOUND', 404);
  }

  slot.is_active = false;
  slot.status = String(input.status ?? 'UNAVAILABLE').trim().toUpperCase() || 'UNAVAILABLE';
  slot.metadata = {
    ...(slot.metadata || {}),
    disabledReason: normalizeString(input.reason ?? input.disabledReason ?? 'Unavailable'),
  };

  await slot.save();
  return sanitizeDocument(slot);
};

export const listSlots = async (filters = {}, currentRole = '') => {
  if (filters.date) {
    await ensureGeneratedSlotsForDate({ date: normalizeString(filters.date), stylistId: filters.stylistId || '' });
  }

  const query = {};

  if (filters.date) {
    query.date = normalizeString(filters.date);
  }

  if (filters.salonId) {
    query.salon_id = assertObjectId(filters.salonId, 'salonId');
  }

  if (filters.stylistId) {
    query.stylist_id = assertObjectId(filters.stylistId, 'staffId');
  }

  if (filters.status) {
    query.status = String(filters.status).trim().toUpperCase();
  }

  if (filters.availableOnly === 'true' || filters.availableOnly === true || (currentRole === '' && filters.includeAll !== 'true' && filters.includeAll !== true)) {
    query.is_active = true;
    query.is_booked = false;
    query.status = 'AVAILABLE';
  }

  const slots = await Slot.find(query).populate('stylist_id').lean({ virtuals: true });
  const normalizedSlots = slots
    .map((slot) => normalizeSlotForResponse(slot))
    .sort((left, right) => {
      const leftDateTime = getSlotDateTime(left);
      const rightDateTime = getSlotDateTime(right);

      if (leftDateTime && rightDateTime) {
        return leftDateTime.getTime() - rightDateTime.getTime();
      }

      if (leftDateTime) return -1;
      if (rightDateTime) return 1;

      return String(left.date || '').localeCompare(String(right.date || '')) || String(left.start_time || '').localeCompare(String(right.start_time || ''));
    });

  const filteredSlots = filters.availableOnly === 'true' || filters.availableOnly === true
    ? normalizedSlots.filter((slot) => slot.available)
    : normalizedSlots;

  return sanitizeDocuments(filteredSlots);
};

export const updateSlotAvailability = async (slotId, input = {}) => {
  assertObjectId(slotId, 'slotId');
  const slot = await Slot.findById(slotId);

  if (!slot) {
    throw buildError('Slot not found.', 'SLOT_NOT_FOUND', 404);
  }

  const status = String(input.status ?? input.availabilityStatus ?? '').trim().toUpperCase();
  const normalizedStatus = status === 'BREAK' ? 'UNAVAILABLE' : status;

  const currentStatus = computeSlotStatus(slot);

  if (currentStatus === 'BOOKED' || currentStatus === 'EXPIRED') {
    throw buildError('Booked or expired slots cannot be manually modified.', 'LOCKED_SLOT', 400);
  }

  if (!['AVAILABLE', 'UNAVAILABLE'].includes(normalizedStatus)) {
    throw buildError('Slot status is invalid.', 'INVALID_SLOT_STATUS', 400);
  }

  slot.status = normalizedStatus;
  slot.is_active = normalizedStatus === 'AVAILABLE';
  slot.is_booked = false;
  slot.booking_id = '';
  slot.metadata = {
    ...(slot.metadata || {}),
    reason: normalizeString(input.reason ?? input.notes ?? slot.metadata?.reason ?? ''),
  };

  await slot.save();
  return sanitizeDocument(slot);
};