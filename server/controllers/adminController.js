import {
  createStaff,
  deleteStaff,
  listStaff,
  updateStaff,
} from '../services/admin/staffService.js';
import {
  createService,
  deleteService,
  listServices,
  toggleServiceAvailability,
  updateService,
} from '../services/admin/serviceService.js';
import { listBookings, updateBookingStatus } from '../services/admin/bookingService.js';
import { updateSalonDetails, updateSalonSlotTimings, updateSalonWorkingHours } from '../services/admin/salonService.js';
import { assignSlotToStaff, createSlots, disableUnavailableSlot } from '../services/admin/slotService.js';

const send = (response, statusCode, data, message) => {
  const payload = { success: true, data };

  if (message) {
    payload.message = message;
  }

  return response.status(statusCode).json(payload);
};

export const getAllStaff = async (request, response, next) => {
  try {
    return send(response, 200, await listStaff());
  } catch (error) {
    return next(error);
  }
};

export const addStaff = async (request, response, next) => {
  try {
    return send(response, 201, await createStaff(request.body), 'Staff created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const editStaff = async (request, response, next) => {
  try {
    return send(response, 200, await updateStaff(request.params.id, request.body), 'Staff updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const removeStaff = async (request, response, next) => {
  try {
    return send(response, 200, await deleteStaff(request.params.id), 'Staff deleted successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getAllServices = async (request, response, next) => {
  try {
    return send(response, 200, await listServices(request.query));
  } catch (error) {
    return next(error);
  }
};

export const addService = async (request, response, next) => {
  try {
    return send(response, 201, await createService(request.body), 'Service created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const editService = async (request, response, next) => {
  try {
    return send(response, 200, await updateService(request.params.id, request.body), 'Service updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const removeService = async (request, response, next) => {
  try {
    return send(response, 200, await deleteService(request.params.id), 'Service deleted successfully.');
  } catch (error) {
    return next(error);
  }
};

export const toggleServiceStatus = async (request, response, next) => {
  try {
    return send(response, 200, await toggleServiceAvailability(request.params.id, request.body), 'Service availability updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getAllBookings = async (request, response, next) => {
  try {
    return send(response, 200, await listBookings(request.query));
  } catch (error) {
    return next(error);
  }
};

export const editBookingStatus = async (request, response, next) => {
  try {
    return send(response, 200, await updateBookingStatus(request.params.id, request.body), 'Booking status updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const editSalonDetails = async (request, response, next) => {
  try {
    return send(response, 200, await updateSalonDetails(request.params.id, request.body), 'Salon details updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const editSalonWorkingHours = async (request, response, next) => {
  try {
    return send(response, 200, await updateSalonWorkingHours(request.params.id, request.body), 'Salon working hours updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const editSalonSlotTimings = async (request, response, next) => {
  try {
    return send(response, 200, await updateSalonSlotTimings(request.params.id, request.body), 'Salon slot timings updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const addSlots = async (request, response, next) => {
  try {
    return send(response, 201, await createSlots(request.body), 'Slots created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const assignSlot = async (request, response, next) => {
  try {
    return send(response, 200, await assignSlotToStaff(request.params.id, request.body), 'Slot assigned successfully.');
  } catch (error) {
    return next(error);
  }
};

export const disableSlot = async (request, response, next) => {
  try {
    return send(response, 200, await disableUnavailableSlot(request.params.id, request.body), 'Slot disabled successfully.');
  } catch (error) {
    return next(error);
  }
};