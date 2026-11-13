import apiClient from '../api/axios';

export const getAdminStaff = async () => {
  const response = await apiClient.get('/admin/staff');
  return response.data;
};

export const createAdminStaff = async (payload) => {
  const response = await apiClient.post('/admin/staff', payload);
  return response.data;
};

export const updateAdminStaff = async (id, payload) => {
  const response = await apiClient.put(`/admin/staff/${id}`, payload);
  return response.data;
};

export const deleteAdminStaff = async (id) => {
  const response = await apiClient.delete(`/admin/staff/${id}`);
  return response.data;
};

export const getAdminServices = async (params = {}) => {
  const response = await apiClient.get('/admin/services', { params });
  return response.data;
};

export const createAdminService = async (payload) => {
  const response = await apiClient.post('/admin/services', payload);
  return response.data;
};

export const updateAdminService = async (id, payload) => {
  const response = await apiClient.put(`/admin/services/${id}`, payload);
  return response.data;
};

export const deleteAdminService = async (id) => {
  const response = await apiClient.delete(`/admin/services/${id}`);
  return response.data;
};

export const toggleAdminService = async (id, payload = {}) => {
  const response = await apiClient.patch(`/admin/services/${id}/toggle`, payload);
  return response.data;
};

export const getAdminBookings = async (params = {}) => {
  const response = await apiClient.get('/admin/bookings', { params });
  return response.data;
};

export const getAdminSlots = async (params = {}) => {
  const response = await apiClient.get('/slots', { params });
  return response.data;
};

export const updateAdminBookingStatus = async (id, payload) => {
  const response = await apiClient.patch(`/admin/bookings/${id}/status`, payload);
  return response.data;
};

export const updateAdminSalon = async (id, payload) => {
  const response = await apiClient.put(`/admin/salons/${id}`, payload);
  return response.data;
};

export const updateAdminSalonWorkingHours = async (id, payload) => {
  const response = await apiClient.patch(`/admin/salons/${id}/working-hours`, payload);
  return response.data;
};

export const updateAdminSalonSlotTimings = async (id, payload) => {
  const response = await apiClient.patch(`/admin/salons/${id}/slot-timings`, payload);
  return response.data;
};

export const createAdminSlots = async (payload) => {
  const response = await apiClient.post('/admin/slots', payload);
  return response.data;
};

export const assignAdminSlot = async (id, payload) => {
  const response = await apiClient.patch(`/admin/slots/${id}/assign`, payload);
  return response.data;
};

export const disableAdminSlot = async (id, payload = {}) => {
  const response = await apiClient.patch(`/slots/${id}/availability`, { ...payload, status: 'UNAVAILABLE' });
  return response.data;
};

export const updateAdminSlotAvailability = async (id, payload = {}) => {
  const response = await apiClient.patch(`/slots/${id}/availability`, payload);
  return response.data;
};

export default {
  getAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  toggleAdminService,
  getAdminBookings,
  getAdminSlots,
  updateAdminBookingStatus,
  updateAdminSalon,
  updateAdminSalonWorkingHours,
  updateAdminSalonSlotTimings,
  createAdminSlots,
  assignAdminSlot,
  disableAdminSlot,
  updateAdminSlotAvailability,
};