import Salon from '../../models/Salon.js';
import { assertObjectId, buildError, normalizeString, sanitizeDocument } from './common.js';

const normalizeHours = (value) => {
  if (Array.isArray(value) && value.length) {
    const firstRange = value[0] || {};
    return {
      start: normalizeString(firstRange.start ?? firstRange.startTime ?? ''),
      end: normalizeString(firstRange.end ?? firstRange.endTime ?? ''),
    };
  }

  if (!value || typeof value !== 'object') {
    return { start: '', end: '' };
  }

  return {
    start: normalizeString(value.start ?? value.startTime ?? ''),
    end: normalizeString(value.end ?? value.endTime ?? ''),
  };
};

const normalizeSlotTimings = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return {
    intervalMinutes: Number.isFinite(Number(value.intervalMinutes)) ? Number(value.intervalMinutes) : 0,
    startTime: normalizeString(value.startTime ?? value.start_time ?? ''),
    endTime: normalizeString(value.endTime ?? value.end_time ?? ''),
    maxParallelSlots: Number.isFinite(Number(value.maxParallelSlots)) ? Number(value.maxParallelSlots) : 0,
  };
};

export const updateSalonDetails = async (salonId, input = {}) => {
  assertObjectId(salonId, 'salonId');

  const update = {};
  const fields = ['name', 'description', 'address', 'city_id', 'area_id', 'state_id', 'contact_number', 'opening_hours', 'images', 'status'];

  for (const field of fields) {
    if (input[field] !== undefined) {
      update[field] = field === 'images' ? (Array.isArray(input[field]) ? input[field] : []) : normalizeString(input[field]);
    }
  }

  const salon = await Salon.findByIdAndUpdate(salonId, update, { new: true, runValidators: true });

  if (!salon) {
    throw buildError('Salon not found.', 'SALON_NOT_FOUND', 404);
  }

  return sanitizeDocument(salon);
};

export const updateSalonWorkingHours = async (salonId, input = {}) => {
  assertObjectId(salonId, 'salonId');
  const salon = await Salon.findByIdAndUpdate(
    salonId,
    { workingHours: normalizeHours(input.workingHours ?? input.working_hours) },
    { new: true, runValidators: true }
  );

  if (!salon) {
    throw buildError('Salon not found.', 'SALON_NOT_FOUND', 404);
  }

  return sanitizeDocument(salon);
};

export const updateSalonSlotTimings = async (salonId, input = {}) => {
  assertObjectId(salonId, 'salonId');
  const salon = await Salon.findByIdAndUpdate(
    salonId,
    { slotTimings: normalizeSlotTimings(input.slotTimings ?? input.slot_timings ?? input) },
    { new: true, runValidators: true }
  );

  if (!salon) {
    throw buildError('Salon not found.', 'SALON_NOT_FOUND', 404);
  }

  return sanitizeDocument(salon);
};