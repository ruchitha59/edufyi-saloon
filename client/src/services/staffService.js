import apiClient from '../api/axios';

export const getStaffAppointments = async (params = {}) => {
  const response = await apiClient.get('/staff/appointments', { params });
  return response.data;
};

export const getStaffServices = async () => {
  const response = await apiClient.get('/staff/services');
  return response.data;
};

export const getStaffSlots = async (params = {}) => {
  const response = await apiClient.get('/slots', { params });
  return response.data;
};

export const updateStaffAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.patch(`/staff/appointments/${appointmentId}/status`, { booking_status: status });
  return response.data;
};

export const updateStaffSlotAvailability = async (slotId, payload = {}) => {
  const response = await apiClient.patch(`/slots/${slotId}/availability/staff`, payload);
  return response.data;
};

export default {
  getStaffAppointments,
  getStaffServices,
  getStaffSlots,
  updateStaffAppointmentStatus,
  updateStaffSlotAvailability,
};
