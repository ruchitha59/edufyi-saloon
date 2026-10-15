import mongoose from 'mongoose';

export const buildError = (message, code = 'ADMIN_ERROR', statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

export const normalizeString = (value = '') => String(value).trim();

export const normalizeIdArray = (value = []) => (Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean) : []);

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || '').trim());

export const assertObjectId = (value, fieldName) => {
  if (!isValidObjectId(value)) {
    throw buildError(`${fieldName} is invalid.`, 'INVALID_ID', 400);
  }

  return String(value).trim();
};

export const toPlainObject = (document) => {
  if (!document) {
    return document;
  }

  return document.toObject ? document.toObject({ virtuals: true }) : { ...document };
};

export const sanitizeDocument = (document, fieldsToRemove = []) => {
  const plain = toPlainObject(document);

  if (!plain) {
    return plain;
  }

  for (const field of fieldsToRemove) {
    delete plain[field];
  }

  return plain;
};

export const sanitizeDocuments = (documents = [], fieldsToRemove = []) => documents.map((document) => sanitizeDocument(document, fieldsToRemove));