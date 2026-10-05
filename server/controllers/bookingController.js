import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import { computeSlotStatus } from '../services/admin/slotService.js';

const buildError = (message, code = 'BOOKING_ERROR', statusCode = 400) => {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
};

export const createBooking = async (req, res, next) => {
  try {
    const { salon_id, stylist_id, slot_id } = req.body;
    const staffId = req.body.staff_id || stylist_id;
    const serviceIds = Array.isArray(req.body.service_ids) ? req.body.service_ids : [];

    if (!staffId || !slot_id) {
      throw buildError('Stylist and slot are required', 'MISSING_FIELDS', 400);
    }

    if (salon_id && !mongoose.Types.ObjectId.isValid(salon_id)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid stylist ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(slot_id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID' });
    }

    const slot = await Slot.findById(slot_id);

    if (!slot) {
      throw buildError('Slot not found', 'SLOT_NOT_FOUND', 404);
    }

    const currentStatus = computeSlotStatus(slot);

    if (currentStatus !== 'AVAILABLE') {
      throw buildError('This slot has already been booked. Please select another slot.', 'SLOT_TAKEN', 409);
    }

    const resolvedSalonId = salon_id || slot.salon_id || null;

    // Reserve slot
    slot.is_booked = true;
    slot.is_active = true;
    slot.status = 'BOOKED';
    await slot.save();

    const customerId = req.body.customer_id || req.customer?._id || new mongoose.Types.ObjectId();

    const booking = await Booking.create({
      customerId,
      customer_id: customerId,
      salonId: resolvedSalonId,
      staffId,
      slotId: slot._id,
      services: serviceIds,
      bookingDate: slot.date,
      bookingSlot: `${slot.start_time}-${slot.end_time}`,
      bookingStatus: 'CONFIRMED',
      selectedServices: Array.isArray(req.body.selected_services) ? req.body.selected_services : [],
      createdBy: req.body.created_by || 'guest-user',
      modifiedBy: req.body.modified_by || 'guest-user',
      appointmentId: req.body.appointment_id || '',
    });

    slot.booking_id = booking._id.toString();
    await slot.save();

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    return next(error);
  }
};

export const getBookingsForCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.customerId || req.customer?._id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer id required' });
    }

    const bookings = await Booking.find({ customerId });
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    return next(error);
  }
};
