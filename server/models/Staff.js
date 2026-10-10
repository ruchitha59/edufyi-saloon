import mongoose from 'mongoose';
import { hashPassword } from '../utils/password.js';
import { SALON_CATEGORIES } from '../config/appConstants.js';

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password_hash: { type: String, required: true, select: false },
    password_salt: { type: String, required: true, select: false },
    role: { type: String, enum: ['staff'], trim: true, default: 'staff' },
    category: { type: [{ type: String, enum: SALON_CATEGORIES }], default: [SALON_CATEGORIES[0]] },
    specialization: { type: String, trim: true, default: '' },
    profileImage: { type: String, trim: true, default: '' },
    services: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
      default: [],
    },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', default: null, index: true },
    workingHours: {
      type: {
        start: { type: String, trim: true, default: '' },
        end: { type: String, trim: true, default: '' },
      },
      default: () => ({ start: '', end: '' }),
    },
    status: { type: String, enum: ['AA', 'IA'], default: 'AA' },
    experience: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    bio: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    area: { type: String, trim: true, default: '' },
    branchName: { type: String, trim: true, default: '' },
    branchId: { type: String, trim: true, default: '' },
    cityId: { type: String, trim: true, default: '' },
    areaId: { type: String, trim: true, default: '' },
    stateId: { type: String, trim: true, default: '' },
    certifications: { type: [String], default: [] },
    professionalGallery: { type: [String], default: [] },
    stylistPhoto: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    collection: 'staff',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

staffSchema.virtual('password').set(function setPassword(value) {
  if (!value) {
    return;
  }

  const { salt, hash } = hashPassword(value);
  this.password_salt = salt;
  this.password_hash = hash;
});

staffSchema.virtual('salon_id').get(function getLegacySalonId() {
  return this.salonId ? this.salonId.toString() : '';
}).set(function setLegacySalonId(value) {
  this.salonId = value;
});

staffSchema.virtual('profile_image').get(function getProfileImage() {
  return this.profileImage || '';
}).set(function setProfileImage(value) {
  this.profileImage = value;
});

staffSchema.virtual('stylist_photo').get(function getStylistPhoto() {
  return this.stylistPhoto || this.profileImage || '';
}).set(function setStylistPhoto(value) {
  this.stylistPhoto = value;
  this.profileImage = value;
});

staffSchema.virtual('branch_name').get(function getBranchName() {
  return this.branchName || '';
}).set(function setBranchName(value) {
  this.branchName = value;
});

staffSchema.virtual('city_id').get(function getCityId() {
  return this.cityId || '';
}).set(function setCityId(value) {
  this.cityId = value;
});

staffSchema.virtual('area_id').get(function getAreaId() {
  return this.areaId || '';
}).set(function setAreaId(value) {
  this.areaId = value;
});

staffSchema.virtual('state_id').get(function getStateId() {
  return this.stateId || '';
}).set(function setStateId(value) {
  this.stateId = value;
});

staffSchema.virtual('professional_gallery').get(function getProfessionalGallery() {
  return this.professionalGallery || [];
}).set(function setProfessionalGallery(value) {
  this.professionalGallery = Array.isArray(value) ? value : [];
});

staffSchema.virtual('working_hours').get(function getWorkingHours() {
  return this.workingHours || { start: '', end: '' };
}).set(function setWorkingHours(value) {
  if (Array.isArray(value) && value.length) {
    const firstRange = value[0] || {};
    this.workingHours = {
      start: firstRange.start || firstRange.startTime || '',
      end: firstRange.end || firstRange.endTime || '',
    };
    return;
  }

  this.workingHours = value && typeof value === 'object' ? value : { start: '', end: '' };
});

const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);

export default Staff;
