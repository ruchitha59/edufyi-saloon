import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    assignedStaff: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
      default: [],
    },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'services',
  }
);

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;