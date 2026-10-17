import crypto from 'crypto';

const PBKDF2_ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export const hashPassword = (password = '') => {
  if (!password) {
    return { salt: '', hash: '' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return { salt, hash };
};

export const verifyPassword = (password = '', salt = '', hash = '') => {
  if (!password || !salt || !hash) {
    return false;
  }

  const computed = crypto.pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  const existingBuffer = Buffer.from(hash, 'hex');
  const computedBuffer = Buffer.from(computed, 'hex');

  if (existingBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(existingBuffer, computedBuffer);
};
