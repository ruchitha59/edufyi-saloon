import mongoose from 'mongoose';

export const buildError = (message, code = 'STAFF_ERROR', statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

export const assertObjectId = (value, fieldName) => {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue || !mongoose.Types.ObjectId.isValid(normalizedValue)) {
    throw buildError(`${fieldName} is invalid.`, 'INVALID_ID', 400);
  }

  return normalizedValue;
};