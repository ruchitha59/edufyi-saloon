import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import { verifyPassword } from '../utils/password.js';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const JWT_EXPIRY = '7d';

const buildError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const normalizeMobileNumber = (value = '') => String(value).trim();

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const normalizePassword = (value = '') => String(value || '').trim();

const normalizeIdentifier = (value = '') => String(value || '').trim();

const isValidIndianMobileNumber = (value = '') => /^[6-9]\d{9}$/.test(value);

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findCustomerByEmail = async (email, projection = '') => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  return Customer.findOne({ email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i') }).select(projection);
};

const findCustomerByIdentifier = async (identifier, projection = '') => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  if (isValidEmail(normalizedIdentifier)) {
    return findCustomerByEmail(normalizedIdentifier, projection);
  }

  if (isValidIndianMobileNumber(normalizedIdentifier)) {
    return Customer.findOne({ mobile_number: normalizedIdentifier }).select(projection);
  }

  return Customer.findOne({
    $or: [
      { email: new RegExp(`^${escapeRegExp(normalizedIdentifier.toLowerCase())}$`, 'i') },
      { mobile_number: normalizedIdentifier },
    ],
  }).select(projection);
};

const findAccountByEmail = async (Model, email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  return Model.findOne({ email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i') }).select('+password_hash +password_salt');
};

const generateOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const sanitizeUser = (user) => {
  if (!user) {
    return user;
  }

  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password_hash;
  delete userObject.password_salt;
  delete userObject.otp_number;
  delete userObject.otp_expiry;
  return userObject;
};

const sanitizeCustomer = sanitizeUser;

const hasCompleteCustomerProfile = (customer) => {
  return Boolean(customer?.name && customer?.age && customer?.gender);
};

const signAuthToken = (userId, role, legacyPayload = {}) => {
  return jwt.sign(
    {
      userId,
      role,
      ...legacyPayload,
    },
    getJwtSecret(),
    {
      expiresIn: JWT_EXPIRY,
    }
  );
};

const loginFirstMatchingAccount = async ({ request, response, next, invalidMessage, targets = [] }) => {
  try {
    const email = normalizeEmail(request.body.email);
    const password = normalizePassword(request.body.password);

    if (!email || !password) {
      throw buildError('Email and password are required.', 'MISSING_FIELDS', 400);
    }

    for (const target of targets) {
      const account = await findAccountByEmail(target.Model, email);

      if (!account) {
        continue;
      }

      if (account.status !== 'AA') {
        throw buildError('Account is inactive.', 'INACTIVE_ACCOUNT', 403);
      }

      const passwordValid = verifyPassword(password, account.password_salt, account.password_hash);

      if (!passwordValid) {
        continue;
      }

      return response.status(200).json({
        success: true,
        token: signAuthToken(account._id.toString(), target.role),
        role: target.role,
        user: sanitizeUser(account),
      });
    }

    throw buildError(invalidMessage, 'INVALID_CREDENTIALS', 401);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

const loginWithPassword = async ({ Model, role, request, response, next, invalidMessage }) => {
  try {
    const email = normalizeEmail(request.body.email);
    const password = normalizePassword(request.body.password);

    if (!email || !password) {
      throw buildError('Email and password are required.', 'MISSING_FIELDS', 400);
    }

    const account = role === 'customer' ? await findCustomerByEmail(email, '+password_hash +password_salt') : await findAccountByEmail(Model, email);

    if (!account) {
      throw buildError(invalidMessage, 'INVALID_CREDENTIALS', 401);
    }

    if (account.status !== 'AA') {
      throw buildError('Account is inactive.', 'INACTIVE_ACCOUNT', 403);
    }

    const passwordValid = verifyPassword(password, account.password_salt, account.password_hash);

    if (!passwordValid) {
      throw buildError(invalidMessage, 'INVALID_CREDENTIALS', 401);
    }

    return response.status(200).json({
      success: true,
      token: signAuthToken(account._id.toString(), role),
      role,
      user: sanitizeUser(account),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
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

export const sendOtp = async (request, response, next) => {
  try {
    const identifier = normalizeIdentifier(request.body.identifier || request.body.email || request.body.mobile_number);
    const password = normalizePassword(request.body.password);

    if (!identifier || !password) {
      throw buildError('Mobile number/email and password are required.', 'MISSING_FIELDS', 400);
    }

    const customer = await findCustomerByIdentifier(identifier, '+password_hash +password_salt');

    if (!customer) {
      throw buildError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
    }

    if (customer.status === 'IA') {
      throw buildError('Account is inactive.', 'INACTIVE_ACCOUNT', 403);
    }

    const passwordValid = verifyPassword(password, customer.password_salt, customer.password_hash);

    if (!passwordValid) {
      throw buildError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
    }

    if (!customer.mobile_number || !isValidIndianMobileNumber(customer.mobile_number)) {
      throw buildError('No valid mobile number is linked to this account.', 'MISSING_MOBILE_NUMBER', 400);
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    customer.otp_number = otp;
    customer.otp_expiry = otpExpiry;
    customer.resend_count = (customer.resend_count || 0) + 1;
    customer.is_verified = false;

    await customer.save();

    console.log('Generated OTP:', otp);
    console.log(`OTP generated for identifier: ${identifier}`);

    return response.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      generated_otp: otp,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const verifyOtp = async (request, response, next) => {
  try {
    const identifier = normalizeIdentifier(request.body.identifier || request.body.email || request.body.mobile_number);
    const otp = normalizeMobileNumber(request.body.otp);

    if (!identifier || !otp) {
      throw buildError('Mobile number/email and OTP are required.', 'MISSING_FIELDS', 400);
    }

    const customer = await findCustomerByIdentifier(identifier);

    if (!customer) {
      throw buildError('Customer not found.', 'CUSTOMER_NOT_FOUND', 404);
    }

    if (!customer.otp_number) {
      throw buildError('OTP is not available for verification.', 'INVALID_OTP', 400);
    }

    if (!customer.otp_expiry || customer.otp_expiry.getTime() < Date.now()) {
      throw buildError('OTP has expired.', 'OTP_EXPIRED', 400);
    }

    if (String(customer.otp_number) !== String(otp)) {
      throw buildError('Invalid OTP.', 'INVALID_OTP', 400);
    }

    const profileComplete = hasCompleteCustomerProfile(customer);

    customer.is_verified = true;
    customer.status = profileComplete ? 'AA' : 'OV';
    customer.otp_number = '';
    customer.otp_expiry = null;

    await customer.save();

    const token = signAuthToken(customer._id.toString(), 'customer', {
      customer_id: customer._id.toString(),
      email: customer.email,
      mobile_number: customer.mobile_number,
    });

    return response.status(200).json({
      success: true,
      token,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const registerCustomer = async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    const ageValue = Number(request.body.age);
    const gender = String(request.body.gender || '').trim();
    const email = normalizeEmail(request.body.email);
    const mobile_number = normalizeMobileNumber(request.body.mobile_number);
    const password = normalizePassword(request.body.password);
    const confirmPassword = normalizePassword(request.body.confirm_password);

    if (!name) {
      throw buildError('Name is required.', 'INVALID_NAME', 400);
    }

    if (name.length < 3 || name.length > 20) {
      throw buildError('Name must be between 3 and 20 characters.', 'INVALID_NAME', 400);
    }

    if (!Number.isInteger(ageValue) || ageValue < 1 || ageValue > 146) {
      throw buildError('Age must be between 1 and 146.', 'INVALID_AGE', 400);
    }

    const allowedGenders = new Set(['Male', 'Female', 'Other']);
    if (!allowedGenders.has(gender)) {
      throw buildError('Gender must be Male, Female, or Other.', 'INVALID_GENDER', 400);
    }

    if (!email || !isValidEmail(email)) {
      throw buildError('Email is required and must be valid.', 'INVALID_EMAIL', 400);
    }

    if (!mobile_number || !isValidIndianMobileNumber(mobile_number)) {
      throw buildError('Mobile number you entered is invalid', 'INVALID_MOBILE_NUMBER', 400);
    }

    if (!password || password.length < 6) {
      throw buildError('Password must be at least 6 characters long.', 'INVALID_PASSWORD', 400);
    }

    if (password !== confirmPassword) {
      throw buildError('Passwords do not match.', 'PASSWORD_MISMATCH', 400);
    }

    const existingByEmail = await findCustomerByEmail(email);
    const existingByMobile = await Customer.findOne({ mobile_number });

    if (existingByEmail && existingByMobile && existingByEmail._id.toString() !== existingByMobile._id.toString()) {
      throw buildError('An account already exists with this email or mobile number.', 'DUPLICATE_ACCOUNT', 409);
    }

    const customer = existingByMobile || existingByEmail || new Customer();

    customer.name = name;
    customer.age = ageValue;
    customer.gender = gender;
    customer.email = email;
    customer.mobile_number = mobile_number;
    customer.password = password;
    customer.is_verified = false;
    customer.status = 'AA';
    customer.otp_number = '';
    customer.otp_expiry = null;

    await customer.save();

    return response.status(200).json({
      success: true,
      message: 'You have successfully created your account.',
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    if (!error.code) {
      error.code = 'SERVER_ERROR';
    }

    return next(error);
  }
};

export const adminLogin = (request, response, next) => {
  return loginFirstMatchingAccount({
    request,
    response,
    next,
    invalidMessage: 'Invalid admin credentials.',
    targets: [{ Model: Admin, role: 'admin' }],
  });
};

export const staffLogin = (request, response, next) => {
  return loginFirstMatchingAccount({
    request,
    response,
    next,
    invalidMessage: 'Invalid staff credentials.',
    targets: [{ Model: Staff, role: 'staff' }],
  });
};

export const staffAdminLogin = (request, response, next) => {
  return loginFirstMatchingAccount({
    request,
    response,
    next,
    invalidMessage: 'Invalid email or password.',
    targets: [
      { Model: Admin, role: 'admin' },
      { Model: Staff, role: 'staff' },
    ],
  });
};