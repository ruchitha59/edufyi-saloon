import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password_hash: { type: String, required: true, select: false },
    password_salt: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin'], default: 'admin' },
    status: { type: String, enum: ['AA', 'IA'], default: 'AA' },
  },
  { timestamps: true, collection: 'admins' }
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
