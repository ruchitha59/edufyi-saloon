import Booking from '../../models/Booking.js';
import Slot from '../../models/Slot.js';
import Staff from '../../models/Staff.js';
import { assertObjectId, buildError } from './common.js';

const ALLOWED_STATUSES = new Set(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);

const ensureStaffOwnership = async (bookingId, staffId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw buildError('Appointment not found.', 'APPOINTMENT_NOT_FOUND', 404);
  }

  if (String(booking.staffId) !== String(staffId)) {
    throw buildError('You do not have permission to access this appointment.', 'FORBIDDEN', 403);
  }

  return booking;
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

export const listAssignedAppointments = async (staffAccountId, filters = {}) => {
  const staffId = assertObjectId(staffAccountId, 'staffId');
  const staff = await Staff.findById(staffId).select('_id');

  if (!staff) {
    throw buildError('Staff not found.', 'STAFF_NOT_FOUND', 404);
  }

  const query = { staffId };
  const conditions = [{ staffId }];

  if (filters.date) {
    const bookingDate = String(filters.date).trim();
    const slotIds = await Slot.find({ date: bookingDate, stylist_id: staffId }).distinct('_id');
    conditions.push({ $or: [{ bookingDate }, ...(slotIds.length ? [{ slotId: { $in: slotIds } }] : [])] });
  }

  if (filters.bookingStatus) {
    conditions.push({ bookingStatus: String(filters.bookingStatus).trim().toUpperCase() });
  }

  const appointments = await Booking.find(conditions.length > 1 ? { $and: conditions } : query)
    .sort({ bookingDate: 1, bookingSlot: 1, createdAt: -1 })
    .populate('customerId')
    .populate('salonId')
    .populate('staffId')
    .populate('slotId')
    .populate('selectedServices.serviceId')
    .lean({ virtuals: true });

  return appointments;
};

export const updateAppointmentStatus = async (bookingId, staffAccountId, input = {}) => {
  const staffId = assertObjectId(staffAccountId, 'staffId');
  const booking = await ensureStaffOwnership(assertObjectId(bookingId, 'bookingId'), staffId);
  const bookingStatus = String(input.bookingStatus ?? input.booking_status ?? '').trim().toUpperCase();

  if (!ALLOWED_STATUSES.has(bookingStatus)) {
    throw buildError('Booking status is invalid.', 'INVALID_BOOKING_STATUS', 400);
  }

  booking.bookingStatus = bookingStatus;
  await booking.save();

  if (bookingStatus === 'CANCELLED') {
    await releaseSlotForBooking(booking);
  }

  const populated = await Booking.findById(booking._id)
    .populate('customerId')
    .populate('salonId')
    .populate('staffId')
    .populate('selectedServices.serviceId')
    .lean({ virtuals: true });

  return populated;
};