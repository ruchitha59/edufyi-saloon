import apiClient from '../api/axios';

export const getAvailableSlots = async (params = {}) => {
  const response = await apiClient.get('/slots/available', { params });
  return response.data;
};

export const getDashboardSlots = async (params = {}) => {
  const response = await apiClient.get('/slots', { params });
  return response.data;
};

export const updateSlotAvailability = async (slotId, payload = {}) => {
  const response = await apiClient.patch(`/slots/${slotId}/availability`, payload);
  return response.data;
};

export const updateStaffSlotAvailability = async (slotId, payload = {}) => {
  const response = await apiClient.patch(`/slots/${slotId}/availability/staff`, payload);
  return response.data;
};

export default {
  getAvailableSlots,
  getDashboardSlots,
  updateSlotAvailability,
  updateStaffSlotAvailability,
};