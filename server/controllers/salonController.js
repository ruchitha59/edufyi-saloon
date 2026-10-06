import mongoose from 'mongoose';
import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Slot from '../models/Slot.js';

export const listSalons = async (req, res, next) => {
  try {
    const query = { status: 'AA' };
    const salons = await Salon.find(query).lean();
    return res.status(200).json({ success: true, data: salons });
  } catch (error) {
    return next(error);
  }
};

export const getSalonById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID' });
    }

    console.log('Received salonId:', id);
    const salon = await Salon.findById(id).lean();

    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    return res.status(200).json({ success: true, data: salon });
  } catch (error) {
    return next(error);
  }
};

export const getSalonStylists = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID' });
    }

    console.log('Received salonId:', id);
    const stylists = await Staff.find({ salonId: id, status: 'AA' }).populate('services').lean({ virtuals: true });
    return res.status(200).json({ success: true, data: stylists });
  } catch (error) {
    return next(error);
  }
};

export const getSalonSlots = async (req, res, next) => {
  try {
    const { id } = req.params; // salon id
    const date = req.query.date || '';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID' });
    }

    console.log('Received salonId:', id);
    const filter = { salon_id: id };

    if (date) {
      filter.date = date;
    }

    const slots = await Slot.find(filter).lean();
    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    return next(error);
  }
};
