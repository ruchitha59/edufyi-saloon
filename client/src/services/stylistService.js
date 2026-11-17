import apiClient from '../api/axios';

export const getStylists = async (params = {}) => {
  const response = await apiClient.get('/stylists', { params });
  return response.data;
};

export const getStylistDetails = async (stylistId) => {
  const response = await apiClient.get(`/stylists/${stylistId}`);
  return response.data;
};

export const getStylistCertifications = async (stylistId) => {
  const response = await apiClient.get(`/stylists/${stylistId}/certifications`);
  return response.data;
};

export const getStylistGallery = async (stylistId) => {
  const response = await apiClient.get(`/stylists/${stylistId}/gallery`);
  return response.data;
};

export const updateAppointmentStylist = async (appointmentId, payload) => {
  const response = await apiClient.put(`/appointments/${appointmentId}`, payload);
  return response.data;
};