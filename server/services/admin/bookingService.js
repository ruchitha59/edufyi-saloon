import Booking from '../../models/Booking.js';
import Slot from '../../models/Slot.js';
import { assertObjectId, buildError, sanitizeDocument, sanitizeDocuments } from './common.js';

const ALLOWED_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);

const normalizeDate = (value = '') => String(value || '').trim();

const getDayRange = (value = '') => {
  const normalized = normalizeDate(value).slice(0, 10);

  if (!normalized) {
    return null;
  }

  const start = new Date(`${normalized}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startKey: start.toISOString().slice(0, 10),
    endKey: end.toISOString().slice(0, 10),
  };
};

const releaseSlotForBooking = async (booking) => {
  const slotId = booking?.slotId || booking?.slot_id;

  if (!slotId) {
    return;
  }

  const slot = await Slot.findById(slotId);

  if (!slot) {
    return;
  }

  slot.is_booked = false;
  slot.is_active = true;
  slot.status = 'AVAILABLE';
  slot.booking_id = '';
  await slot.save();
};

export const listBookings = async (filters = {}) => {
  const query = {};
  const conditions = [];

  if (filters.date) {
    const dayRange = getDayRange(filters.date);

    if (dayRange) {
      const slotIds = await Slot.find({ date: { $gte: dayRange.startKey, $lt: dayRange.endKey } }).distinct('_id');
      conditions.push({
        $or: [
          { bookingDate: { $gte: dayRange.startKey, $lt: dayRange.endKey } },
          ...(slotIds.length ? [{ slotId: { $in: slotIds } }] : []),
        ],
      });
    }
  }

  if (filters.staffId) {
    conditions.push({ staffId: assertObjectId(filters.staffId, 'staffId') });
  }

  if (filters.salonId) {
    const salonId = assertObjectId(filters.salonId, 'salonId');
    const slotIds = await Slot.find({ salon_id: salonId }).distinct('_id');
    conditions.push({
      $or: [
        { salonId },
        ...(slotIds.length ? [{ slotId: { $in: slotIds } }] : []),
      ],
    });
  }

  if (filters.bookingStatus) {
    conditions.push({ bookingStatus: String(filters.bookingStatus).trim().toUpperCase() });
  }

  if (conditions.length) {
    query.$and = conditions;
  }

  const bookings = await Booking.find(query).sort({ bookingDate: 1, bookingSlot: 1, createdAt: -1 })
    .populate('customerId')
    .populate('salonId')
    .populate('staffId')
    .populate('slotId')
    .populate('selectedServices.serviceId')
    .lean({ virtuals: true });

  console.log('Bookings returned:', bookings);
  console.log('Bookings count:', bookings.length);

  return sanitizeDocuments(bookings);
};

export const updateBookingStatus = async (bookingId, input = {}) => {
  assertObjectId(bookingId, 'bookingId');
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw buildError('Booking not found.', 'BOOKING_NOT_FOUND', 404);
  }

  const bookingStatus = String(input.bookingStatus ?? input.booking_status ?? '').trim().toUpperCase();

  if (!ALLOWED_STATUSES.has(bookingStatus)) {
    throw buildError('Booking status is invalid.', 'INVALID_BOOKING_STATUS', 400);
  }

  booking.bookingStatus = bookingStatus;
  booking.modifiedBy = String(input.modifiedBy ?? input.modified_by ?? booking.modifiedBy ?? 'admin').trim();
  await booking.save();

  if (bookingStatus === 'CANCELLED') {
    await releaseSlotForBooking(booking);
    await Slot.updateMany(
      { booking_id: booking._id.toString() },
      { $set: { is_booked: false }, $unset: { booking_id: '' } }
    );
  }

  return sanitizeDocument(await Booking.findById(booking._id).populate('customerId').populate('salonId').populate('staffId').populate('selectedServices.serviceId').lean({ virtuals: true }));
};