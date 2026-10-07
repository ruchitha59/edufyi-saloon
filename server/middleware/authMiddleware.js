import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';

const buildError = (message, code, statusCode = 401) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const getJwtSecret = () => {
  const configuredSecret = String(process.env.JWT_SECRET || '').trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'saloon-dev-jwt-secret';
  }

  throw buildError('JWT secret is not configured.', 'JWT_SECRET_MISSING', 500);
};

const ROLE_MODEL_MAP = {
  customer: Customer,
  admin: Admin,
  staff: Staff,
};

const normalizeRole = (role = '') => {
  if (role === 'stylist' || role === 'manager') {
    return 'staff';
  }

  return role;
};

const getDecodedRole = (decoded = {}) => normalizeRole(decoded.role || (decoded.customer_id ? 'customer' : ''));

const getDecodedUserId = (decoded = {}) => decoded.userId || decoded.customer_id || decoded.admin_id || decoded.staff_id || '';

const authorizeRequest = (allowedRoles = []) => async (request, _response, next) => {
  try {
    const authHeader = request.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      throw buildError('Authorization token is missing.', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw buildError('Authorization token is missing.', 'UNAUTHORIZED', 401);
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const role = getDecodedRole(decoded);
    const userId = getDecodedUserId(decoded);

    if (!role || !userId) {
      throw buildError('Invalid authorization token.', 'UNAUTHORIZED', 401);
    }

    if (allowedRoles.length && !allowedRoles.includes(role)) {
      throw buildError('You do not have permission to access this resource.', 'FORBIDDEN', 403);
    }

    const Model = ROLE_MODEL_MAP[role];

    if (!Model) {
      throw buildError('Invalid authorization token.', 'UNAUTHORIZED', 401);
    }

    const user = await Model.findById(userId);

    if (!user) {
      throw buildError(`${role.charAt(0).toUpperCase() + role.slice(1)} not found.`, 'USER_NOT_FOUND', 404);
    }

    request.authUser = user;
    request.user = user;
    request.customer = role === 'customer' ? user : request.customer;
    request.role = role;
    request.token = token;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.code = 'TOKEN_EXPIRED';
      error.message = 'Authorization token has expired.';
    } else if (error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      error.message = 'Invalid authorization token.';
    } else if (!error.statusCode) {
      error.statusCode = 500;
    }

    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const authMiddleware = authorizeRequest;

export const protect = authorizeRequest(['customer']);

export const adminMiddleware = authorizeRequest(['admin']);

export const staffMiddleware = authorizeRequest(['staff']);