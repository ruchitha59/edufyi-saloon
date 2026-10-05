import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Slot from '../models/Slot.js';
import { computeSlotStatus } from '../services/admin/slotService.js';

const buildError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 400;
  return error;
};

const normalizeSelectedServices = (services = []) =>
  services
    .filter(Boolean)
    .map((service) => ({
      id: service.id || service.service_id || '',
      name: service.name || service.service_name || '',
      service_name: service.service_name || service.name || '',
      duration: service.duration || '',
      price: Number(service.price || 0),
    }));

const parseDurationToMinutes = (duration = '') => {
  const value = String(duration).trim().toLowerCase();

  if (!value) {
    return 0;
  }

  const hourMatch = value.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
  if (hourMatch) {
    return Math.round(Number.parseFloat(hourMatch[1]) * 60);
  }

  const minuteMatch = value.match(/(\d+)\s*(m|min|mins|minute|minutes)/);
  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10);
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatMinutes = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours && !remainingMinutes) {
    return '0 min';
  }

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  if (!remainingMinutes) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} min`;
};

const calculateServiceTotals = (services = []) => {
  const normalizedServices = normalizeSelectedServices(services);

  return normalizedServices.reduce(
    (totals, service) => {
      totals.totalPrice += Number(service.price || 0);
      totals.totalMinutes += parseDurationToMinutes(service.duration);
      return totals;
    },
    { totalPrice: 0, totalMinutes: 0 }
  );
};

const ensureAppointmentId = async (appointment) => {
  if (appointment && !appointment.appointmentId) {
    appointment.appointmentId = appointment._id.toString();
    await appointment.save();
  }

  return appointment;
};

const releaseSlot = async (slotId = '') => {
  if (!slotId) {
    return;
  }

  const slot = await Slot.findById(slotId);

  if (slot) {
    slot.is_booked = false;
    slot.is_active = true;
    slot.status = 'AVAILABLE';
    slot.booking_id = '';
    await slot.save();
  }
};

const syncSlotForAppointment = async ({ nextSlotId = '', previousSlotId = '', appointmentId = '' }) => {
  if (previousSlotId && previousSlotId !== nextSlotId) {
    await releaseSlot(previousSlotId);
  }

  if (nextSlotId) {
    const slot = await Slot.findById(nextSlotId);

    if (!slot) {
      throw new Error('Selected slot not found.');
    }

    const slotBelongsToAppointment = slot.booking_id && String(slot.booking_id) === String(appointmentId);

    if (computeSlotStatus(slot) !== 'AVAILABLE' && !slotBelongsToAppointment) {
      throw new Error('This slot has already been booked. Please select another slot.');
    }

    slot.is_booked = true;
    slot.is_active = true;
    slot.status = 'BOOKED';
    slot.booking_id = appointmentId;
    await slot.save();
  }
};

const normalizeObjectIdOrNull = (value = '') => {
  const text = String(value || '').trim();
  return mongoose.Types.ObjectId.isValid(text) ? text : null;
};

const getSlotTiming = (slot = null) => {
  if (!slot) {
    return { bookingDate: '', bookingSlot: '' };
  }

  return {
    bookingDate: String(slot.date || slot.slotDate || '').trim(),
    bookingSlot: [slot.start_time || slot.startTime || '', slot.end_time || slot.endTime || ''].filter(Boolean).join('-'),
  };
};

export const createAppointment = async (request, response, next) => {
  try {
    const { main_category = '', sub_category = '' } = request.body;
    const customerId = request.body.customer_id || request.customer?._id || new mongoose.Types.ObjectId();
    const createdBy = request.body.created_by || request.body.user_id || 'guest-user';
    const modifiedBy = request.body.modified_by || createdBy;
    const staffId = request.body.staff_id || request.body.stylist_id || '';
    const salonId = request.body.salon_id || request.body.salonId || null;
    const slotId = normalizeObjectIdOrNull(request.body.slot_id);
    const slot = slotId ? await Slot.findById(slotId) : null;

    // Support both selected_services payload and service_ids list
    const selectedServices = Array.isArray(request.body.selected_services)
      ? normalizeSelectedServices(request.body.selected_services)
      : [];
    const serviceIds = Array.isArray(request.body.service_ids) ? request.body.service_ids : [];

    const totals = calculateServiceTotals(selectedServices);

    const appointment = await Appointment.create({
      customerId,
      customer_id: customerId,
      staffId,
      salonId,
      slotId,
      bookingDate: request.body.booking_date || getSlotTiming(slot).bookingDate,
      bookingSlot: request.body.booking_slot || getSlotTiming(slot).bookingSlot,
      services: serviceIds,
      mainCategory: main_category,
      subCategory: sub_category,
      selectedServices: selectedServices,
      totalPrice: totals.totalPrice,
      totalDuration: formatMinutes(totals.totalMinutes),
      modifiedBy,
      bookingStatus: 'PENDING',
      paymentStatus: 'NOT_STARTED',
      createdBy,
      appointmentId: '',
    });

    await ensureAppointmentId(appointment);

    if (slotId) {
      await syncSlotForAppointment({ nextSlotId: slotId, appointmentId: appointment._id.toString() });
    }

    return response.status(201).json({ success: true, message: 'Appointment draft created successfully.', data: appointment });
  } catch (error) {
    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const getAppointmentById = async (request, response, next) => {
  try {
    const appointment = await Appointment.findById(request.params.id);

    if (!appointment) {
      throw buildError('Appointment not found.', 'NOT_FOUND');
    }

    await ensureAppointmentId(appointment);

    return response.status(200).json({
      success: true,
      message: 'Appointment fetched successfully.',
      data: appointment,
    });
  } catch (error) {
    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const updateAppointment = async (request, response, next) => {
  try {
    const appointment = await Appointment.findById(request.params.id);

    if (!appointment) {
      throw buildError('Appointment not found.', 'NOT_FOUND');
    }

    const selectedServices = Array.isArray(request.body.selected_services)
      ? normalizeSelectedServices(request.body.selected_services)
      : appointment.selectedServices;
    const totals = calculateServiceTotals(selectedServices);
    const nextSalonId = request.body.salon_id || request.body.salonId || appointment.salonId || null;
    const nextSlotId = normalizeObjectIdOrNull(request.body.slot_id) || appointment.slotId || null;
    const previousSlotId = appointment.slotId || '';
    const nextSlot = nextSlotId ? await Slot.findById(nextSlotId) : null;
    const nextTiming = getSlotTiming(nextSlot);
    appointment.bookingDate = request.body.booking_date || nextTiming.bookingDate || appointment.bookingDate;
    appointment.bookingSlot = request.body.booking_slot || nextTiming.bookingSlot || appointment.bookingSlot;
    appointment.staffId = request.body.staff_id || request.body.stylist_id || appointment.staffId;
    appointment.salonId = nextSalonId || null;
    appointment.slotId = nextSlotId || null;
    appointment.services = Array.isArray(request.body.service_ids) ? request.body.service_ids : appointment.services;
    appointment.selectedServices = selectedServices;
    appointment.totalPrice = Number.isFinite(Number(request.body.total_price))
      ? Number(request.body.total_price)
      : totals.totalPrice;
    appointment.totalDuration = request.body.total_duration || formatMinutes(totals.totalMinutes);
    appointment.modifiedBy = request.body.modified_by || appointment.modifiedBy || 'guest-user';
    appointment.bookingStatus = request.body.booking_status || appointment.bookingStatus;
    appointment.paymentStatus = request.body.payment_status || appointment.paymentStatus || 'NOT_STARTED';
    appointment.paymentMethod = request.body.payment_method || appointment.paymentMethod || '';
    appointment.appointmentId = appointment.appointmentId || appointment._id.toString();
    appointment.customer_id = appointment.customer_id || appointment.customerId;
    appointment.customerId = appointment.customerId || appointment.customer_id;

    await appointment.save();

    const nextBookingStatus = String(appointment.bookingStatus || '').toUpperCase();
    const nextPaymentStatus = String(appointment.paymentStatus || '').toUpperCase();

    if (nextBookingStatus === 'CANCELLED' || nextBookingStatus === 'PAYMENT_FAILED' || nextPaymentStatus === 'FAILED') {
      await syncSlotForAppointment({ previousSlotId: nextSlotId || previousSlotId, appointmentId: appointment._id.toString() });
    } else if (nextSlotId) {
      await syncSlotForAppointment({ nextSlotId, previousSlotId, appointmentId: appointment._id.toString() });
    }

    return response.status(200).json({
      success: true,
      message: 'Appointment updated successfully.',
      data: appointment,
    });
  } catch (error) {
    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const updateAppointmentStylist = updateAppointment;

export const markPaymentFailed = async (request, response, next) => {
  try {
    const appointment = await Appointment.findById(request.params.id);

    if (!appointment) {
      throw buildError('Appointment not found.', 'NOT_FOUND');
    }

    appointment.paymentStatus = 'FAILED';
    appointment.bookingStatus = 'PAYMENT_FAILED';
    appointment.modifiedBy = request.body?.modified_by || appointment.modifiedBy || 'guest-user';
    appointment.appointmentId = appointment.appointmentId || appointment._id.toString();
    await appointment.save();

    await releaseSlot(appointment.slotId);

    return response.status(200).json({
      success: true,
      message: 'Payment failed and slot released.',
      data: appointment,
    });
  } catch (error) {
    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};
