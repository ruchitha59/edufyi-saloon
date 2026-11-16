import apiClient from '../api/axios';

const ensureSalonId = (salonId) => {
  const normalizedSalonId = String(salonId || '').trim();

  if (!normalizedSalonId) {
    throw new Error('Please select a salon before continuing');
  }

  return normalizedSalonId;
};

export const getSalons = async (params = {}) => {
  const response = await apiClient.get('/salons', { params });
  return response.data;
};

export const getSalon = async (salonId) => {
  const response = await apiClient.get(`/salons/${ensureSalonId(salonId)}`);
  return response.data;
};

export const getSalonStylists = async (salonId) => {
  const response = await apiClient.get(`/salons/${ensureSalonId(salonId)}/stylists`);
  return response.data;
};

export const getSalonSlots = async (salonId, date) => {
  const response = await apiClient.get(`/salons/${ensureSalonId(salonId)}/slots`, { params: { date } });
  return response.data;
};

export default {
  getSalons,
  getSalon,
  getSalonStylists,
  getSalonSlots,
};
