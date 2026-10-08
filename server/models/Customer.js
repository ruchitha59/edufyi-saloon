import mongoose from 'mongoose';
import { hashPassword } from '../utils/password.js';

const customerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    mobile_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    otp_number: {
      type: String,
      trim: true,
      default: '',
    },
    otp_expiry: {
      type: Date,
      default: null,
    },
    resend_count: {
      type: Number,
      default: 0,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    password_hash: {
      type: String,
      select: false,
    },
    password_salt: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['OS', 'OV', 'AA', 'IA'],
      default: 'OS',
    },
  },
  {
    timestamps: true,
    collection: 'customers',
  }
);

customerSchema.virtual('password').set(function setPassword(value) {
  if (!value) {
    return;
  }

  const { salt, hash } = hashPassword(value);
  this.password_salt = salt;
  this.password_hash = hash;
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;