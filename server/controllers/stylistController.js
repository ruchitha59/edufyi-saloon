import Staff from '../models/Staff.js';
import { SALON_CATEGORIES } from '../config/appConstants.js';

const buildError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const buildFilter = (query) => {
  const filter = { status: 'AA' };

  if (query.category) {
    filter.category = SALON_CATEGORIES.includes(query.category) ? query.category : SALON_CATEGORIES[0];
  }

  if (query.subcategory) {
    filter.subcategory = query.subcategory;
  }

  if (query.branch_id) {
    filter.branch_id = query.branch_id;
  }

  if (query.city_id) {
    filter.city_id = query.city_id;
  }

  if (query.area_id) {
    filter.area_id = query.area_id;
  }

  if (query.state_id) {
    filter.state_id = query.state_id;
  }

  if (query.status) {
    filter.status = query.status;
  }

  return filter;
};

const normalizeService = (service = {}) => ({
  id: service?._id?.toString?.() || service?.id || '',
  name: service?.serviceName || service?.name || '',
  duration: service?.duration || '',
  price: Number(service?.price || 0),
});

const normalizeStylist = (staff = {}) => ({
  ...staff,
  _id: staff._id,
  id: staff._id?.toString?.() || staff.id || '',
  category: Array.isArray(staff.category) ? staff.category : staff.category ? [staff.category] : [],
  stylist_photo: staff.stylistPhoto || staff.profileImage || staff.profile_image || '',
  profileImage: staff.stylistPhoto || staff.profileImage || staff.profile_image || '',
  branch_name: staff.branchName || staff.branch_name || '',
  city: staff.city || '',
  area: staff.area || '',
  city_id: staff.cityId || staff.city_id || '',
  area_id: staff.areaId || staff.area_id || '',
  state_id: staff.stateId || staff.state_id || '',
  professional_gallery: staff.professionalGallery || staff.professional_gallery || [],
  certifications: staff.certifications || [],
  working_hours: staff.workingHours?.start && staff.workingHours?.end ? `${staff.workingHours.start} - ${staff.workingHours.end}` : staff.working_hours || '',
  services: (staff.services || []).map(normalizeService),
});

export const getStylists = async (request, response, next) => {
  try {
    const stylists = await Staff.find(buildFilter(request.query)).populate('services').sort({ rating: -1, experience: -1, name: 1 }).lean({ virtuals: true });

    return response.status(200).json({
      success: true,
      data: stylists.map(normalizeStylist),
    });
  } catch (error) {
    return next(error);
  }
};

export const getStylistById = async (request, response, next) => {
  try {
    const stylist = await Staff.findOne({ _id: request.params.id, status: 'AA' }).populate('services').lean({ virtuals: true });

    if (!stylist) {
      throw buildError('Stylist not found.', 'NOT_FOUND', 404);
    }

    return response.status(200).json({
      success: true,
      data: normalizeStylist(stylist),
    });
  } catch (error) {
    return next(error);
  }
};

export const getStylistCertifications = async (request, response, next) => {
  try {
    const stylist = await Staff.findOne({ _id: request.params.id, status: 'AA' }).select('certifications name').lean({ virtuals: true });

    if (!stylist) {
      throw buildError('Stylist not found.', 'NOT_FOUND', 404);
    }

    return response.status(200).json({
      success: true,
      data: {
        stylist_id: stylist._id,
        name: stylist.name,
        certifications: stylist.certifications,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getStylistGallery = async (request, response, next) => {
  try {
    const stylist = await Staff.findOne({ _id: request.params.id, status: 'AA' }).select('professionalGallery name').lean({ virtuals: true });

    if (!stylist) {
      throw buildError('Stylist not found.', 'NOT_FOUND', 404);
    }

    return response.status(200).json({
      success: true,
      data: {
        stylist_id: stylist._id,
        name: stylist.name,
        professional_gallery: stylist.professionalGallery || stylist.professional_gallery || [],
      },
    });
  } catch (error) {
    return next(error);
  }
};