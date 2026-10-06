import { listAssignedAppointments, updateAppointmentStatus } from '../services/staff/appointmentService.js';
import Service from '../models/Service.js';

const send = (response, statusCode, data, message) => {
  const payload = { success: true, data };

  if (message) {
    payload.message = message;
  }

  return response.status(statusCode).json(payload);
};

export const getStaffAppointments = async (request, response, next) => {
  try {
    const staffId = request.user?._id || request.authUser?._id;
    return send(response, 200, await listAssignedAppointments(staffId, request.query));
  } catch (error) {
    return next(error);
  }
};

export const patchStaffAppointmentStatus = async (request, response, next) => {
  try {
    const staffId = request.user?._id || request.authUser?._id;
    return send(response, 200, await updateAppointmentStatus(request.params.id, staffId, request.body), 'Appointment status updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getStaffServices = async (request, response, next) => {
  try {
    const staffId = request.user?._id || request.authUser?._id;
    const services = await Service.find({ assignedStaff: staffId, active: true }).sort({ createdAt: -1 }).populate('salonId').lean();

    return send(response, 200, services);
  } catch (error) {
    return next(error);
  }
};