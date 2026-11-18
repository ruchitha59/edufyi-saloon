import { getAuthenticatedCustomerId } from './auth';

export const getCustomerId = (fallbackCustomerId = '') => {
  return getAuthenticatedCustomerId(fallbackCustomerId);
};