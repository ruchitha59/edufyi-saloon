import mongoose from 'mongoose';

const bookingServiceSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
    id: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    serviceName: { type: String, trim: true, default: '' },
    service_name: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: false, default: null, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', default: null, index: true },
    services: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    selectedServices: {
      type: [bookingServiceSchema],
      default: [],
    },
    bookingDate: { type: String, trim: true, default: '' },
    bookingSlot: { type: String, trim: true, default: '' },
    bookingStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PAYMENT_FAILED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PAYMENT_PENDING', 'SUCCESS', 'FAILED'],
      default: 'NOT_STARTED',
      index: true,
    },
    paymentMethod: { type: String, trim: true, default: '' },
    appointmentId: { type: String, trim: true, default: '' },
    mainCategory: { type: String, trim: true, default: '' },
    subCategory: { type: String, trim: true, default: '' },
    totalPrice: { type: Number, default: 0 },
    totalDuration: { type: String, trim: true, default: '' },
    createdBy: { type: String, trim: true, default: 'guest-user' },
    modifiedBy: { type: String, trim: true, default: 'guest-user' },
  },
  {
    timestamps: true,
    collection: 'appointments',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.pre('validate', function syncCustomerFields(next) {
  if (this.customerId && !this.customer_id) {
    this.customer_id = this.customerId;
  }

  if (this.customer_id && !this.customerId) {
    this.customerId = this.customer_id;
  }

  next();
});

bookingSchema.virtual('salon_id').get(function getSalonId() {
  return this.salonId ? this.salonId.toString() : '';
}).set(function setSalonId(value) {
  this.salonId = value;
});

bookingSchema.virtual('staff_id').get(function getStaffId() {
  return this.staffId ? this.staffId.toString() : '';
}).set(function setStaffId(value) {
  this.staffId = value;
});

bookingSchema.virtual('slot_id').get(function getSlotId() {
  return this.slotId ? this.slotId.toString() : '';
}).set(function setSlotId(value) {
  this.slotId = value;
});

bookingSchema.virtual('booking_date').get(function getBookingDate() {
  return this.bookingDate || '';
}).set(function setBookingDate(value) {
  this.bookingDate = value;
});

bookingSchema.virtual('booking_slot').get(function getBookingSlot() {
  return this.bookingSlot || '';
}).set(function setBookingSlot(value) {
  this.bookingSlot = value;
});

bookingSchema.virtual('booking_status').get(function getBookingStatus() {
  return this.bookingStatus || 'PENDING';
}).set(function setBookingStatus(value) {
  this.bookingStatus = value;
});

bookingSchema.virtual('payment_status').get(function getPaymentStatus() {
  return this.paymentStatus || 'NOT_STARTED';
}).set(function setPaymentStatus(value) {
  this.paymentStatus = value;
});

bookingSchema.virtual('payment_method').get(function getPaymentMethod() {
  return this.paymentMethod || '';
}).set(function setPaymentMethod(value) {
  this.paymentMethod = value;
});

bookingSchema.virtual('selected_services').get(function getSelectedServices() {
  return this.selectedServices || [];
}).set(function setSelectedServices(value) {
  this.selectedServices = Array.isArray(value) ? value : [];
});

bookingSchema.virtual('appointment_id').get(function getAppointmentId() {
  return this.appointmentId || '';
}).set(function setAppointmentId(value) {
  this.appointmentId = value;
});

bookingSchema.virtual('main_category').get(function getMainCategory() {
  return this.mainCategory || '';
}).set(function setMainCategory(value) {
  this.mainCategory = value;
});

bookingSchema.virtual('sub_category').get(function getSubCategory() {
  return this.subCategory || '';
}).set(function setSubCategory(value) {
  this.subCategory = value;
});

bookingSchema.virtual('total_price').get(function getTotalPrice() {
  return this.totalPrice || 0;
}).set(function setTotalPrice(value) {
  this.totalPrice = value;
});

bookingSchema.virtual('total_duration').get(function getTotalDuration() {
  return this.totalDuration || '';
}).set(function setTotalDuration(value) {
  this.totalDuration = value;
});

bookingSchema.virtual('created_by').get(function getCreatedBy() {
  return this.createdBy || 'guest-user';
}).set(function setCreatedBy(value) {
  this.createdBy = value;
});

bookingSchema.virtual('modified_by').get(function getModifiedBy() {
  return this.modifiedBy || 'guest-user';
}).set(function setModifiedBy(value) {
  this.modifiedBy = value;
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;
