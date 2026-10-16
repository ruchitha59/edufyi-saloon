import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import { hashPassword } from '../utils/password.js';

const demoAccounts = [
  {
    model: Customer,
    label: 'customer',
    name: 'Demo Customer',
    email: process.env.DEMO_CUSTOMER_EMAIL || 'customer.demo@saloon.local',
    password: process.env.DEMO_CUSTOMER_PASSWORD || 'Customer@12345',
    role: 'customer',
    mobile_number: process.env.DEMO_CUSTOMER_MOBILE || '9876543210',
    age: Number(process.env.DEMO_CUSTOMER_AGE || 27),
    gender: process.env.DEMO_CUSTOMER_GENDER || 'Other',
  },
  {
    model: Admin,
    label: 'admin',
    name: 'Demo Admin',
    email: process.env.DEMO_ADMIN_EMAIL || 'admin.demo@saloon.local',
    password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  },
  {
    model: Staff,
    label: 'staff',
    name: 'Demo Staff',
    email: process.env.DEMO_STAFF_EMAIL || 'staff.demo@saloon.local',
    password: process.env.DEMO_STAFF_PASSWORD || 'Staff@12345',
    role: 'staff',
  },
];

const seedAccount = async ({ model, label, name, email, password, role, mobile_number, age, gender }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error(`Missing ${label} seed configuration.`);
  }

  const { salt, hash } = hashPassword(password);

  const existingAccount = await model.findOne({ email: normalizedEmail }).select('_id email');

  if (existingAccount) {
    const updatePayload = {
      name,
      email: normalizedEmail,
      password_hash: hash,
      password_salt: salt,
      role,
      status: 'AA',
    };

    if (mobile_number) {
      updatePayload.mobile_number = mobile_number;
    }

    if (typeof age === 'number' && !Number.isNaN(age)) {
      updatePayload.age = age;
    }

    if (gender) {
      updatePayload.gender = gender;
    }

    await model.updateOne({ _id: existingAccount._id }, { $set: updatePayload });

    return { label, email: normalizedEmail, created: false };
  }

  const createPayload = {
    name,
    email: normalizedEmail,
    password_hash: hash,
    password_salt: salt,
    role,
    status: 'AA',
  };

  if (mobile_number) {
    createPayload.mobile_number = mobile_number;
  }

  if (typeof age === 'number' && !Number.isNaN(age)) {
    createPayload.age = age;
  }

  if (gender) {
    createPayload.gender = gender;
  }

  await model.create(createPayload);

  return { label, email: normalizedEmail, created: true };
};

export const seedDemoAccounts = async () => {
  const results = [];

  for (const account of demoAccounts) {
    results.push(await seedAccount(account));
  }

  return results;
};

export const getDemoAccountCredentials = () => {
  return demoAccounts.map(({ label, email, password }) => ({
    label,
    email: String(email || '').trim().toLowerCase(),
    password,
  }));
};