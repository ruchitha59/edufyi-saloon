import mongoose from 'mongoose';

const salonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city_id: { type: String, trim: true, default: '' },
    area_id: { type: String, trim: true, default: '' },
    state_id: { type: String, trim: true, default: '' },
    contact_number: { type: String, trim: true, default: '' },
    opening_hours: { type: String, trim: true, default: '' },
    workingHours: {
      type: {
        start: { type: String, trim: true, default: '' },
        end: { type: String, trim: true, default: '' },
      },
      default: () => ({ start: '', end: '' }),
    },
    slotTimings: {
      type: {
        startTime: { type: String, trim: true, default: '' },
        endTime: { type: String, trim: true, default: '' },
        intervalMinutes: { type: Number, default: 0 },
        maxParallelSlots: { type: Number, default: 0 },
      },
      default: {},
    },
    staff: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
      default: [],
    },
    services: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
      default: [],
    },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['AA', 'IA'], default: 'AA' },
  },
  {
    timestamps: true,
    collection: 'salons',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

salonSchema.virtual('working_hours').get(function getWorkingHours() {
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

salonSchema.virtual('slot_timings').get(function getSlotTimings() {
  return this.slotTimings || {};
}).set(function setSlotTimings(value) {
  this.slotTimings = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
});

const Salon = mongoose.models.Salon || mongoose.model('Salon', salonSchema);

export default Salon;
