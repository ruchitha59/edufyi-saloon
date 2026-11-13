import apiClient from '../api/axios';

export const createBooking = async (payload) => {
  const response = await apiClient.post('/bookings', payload);
  return response.data;
};

export const getBookingsForCustomer = async (customerId) => {
  const response = await apiClient.get(`/bookings/customer/${customerId}`);
  return response.data;
};

export default { createBooking, getBookingsForCustomer };
