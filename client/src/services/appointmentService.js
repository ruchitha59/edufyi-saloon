import apiClient from '../api/axios';

export const createAppointment = async (payload) => {
  const response = await apiClient.post('/appointments', payload);
  return response.data;
};

export const getAppointmentById = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

export const updateAppointment = async (appointmentId, payload) => {
  const response = await apiClient.put(`/appointments/${appointmentId}`, payload);
  return response.data;
};

export const markAppointmentPaymentFailed = async (appointmentId, payload = {}) => {
  const response = await apiClient.post(`/appointments/${appointmentId}/payment-failed`, payload);
  return response.data;
};
