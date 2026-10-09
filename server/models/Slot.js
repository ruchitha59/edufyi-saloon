import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    salon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: false, default: null, index: true },
    stylist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null, index: true },
    date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    is_booked: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'BOOKED', 'EXPIRED'],
      default: 'AVAILABLE',
      index: true,
    },
    booking_id: { type: String, trim: true, default: '' },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: true,
    collection: 'slots',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

slotSchema.virtual('salonId').get(function getSalonId() {
  return this.salon_id ? this.salon_id.toString() : '';
}).set(function setSalonId(value) {
  this.salon_id = value;
});

slotSchema.virtual('staffId').get(function getStaffId() {
  return this.stylist_id ? this.stylist_id.toString() : '';
}).set(function setStaffId(value) {
  this.stylist_id = value;
});

slotSchema.virtual('slotDate').get(function getSlotDate() {
  return this.date || '';
}).set(function setSlotDate(value) {
  this.date = value;
});

slotSchema.virtual('startTime').get(function getStartTime() {
  return this.start_time || '';
}).set(function setStartTime(value) {
  this.start_time = value;
});

slotSchema.virtual('endTime').get(function getEndTime() {
  return this.end_time || '';
}).set(function setEndTime(value) {
  this.end_time = value;
});

slotSchema.virtual('isActive').get(function getIsActive() {
  return this.is_active;
}).set(function setIsActive(value) {
  this.is_active = Boolean(value);
});

slotSchema.virtual('availabilityStatus').get(function getAvailabilityStatus() {
  return this.status || 'AVAILABLE';
}).set(function setAvailabilityStatus(value) {
  this.status = String(value || 'AVAILABLE').toUpperCase();
});

slotSchema.virtual('bookingId').get(function getBookingId() {
  return this.booking_id || '';
}).set(function setBookingId(value) {
  this.booking_id = value;
});

const Slot = mongoose.model('Slot', slotSchema);

export default Slot;
