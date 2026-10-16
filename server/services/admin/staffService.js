import Staff from '../../models/Staff.js';
import Salon from '../../models/Salon.js';
import Service from '../../models/Service.js';
import Slot from '../../models/Slot.js';
import { SALON_CATEGORIES } from '../../config/appConstants.js';
import { assertObjectId, buildError, normalizeIdArray, normalizeString, sanitizeDocument, sanitizeDocuments } from './common.js';

const STAFF_PRIVATE_FIELDS = ['password_hash', 'password_salt'];

const ensureSalonExists = async (salonId) => {
  if (!salonId) {
    return null;
  }

  const salon = await Salon.findById(salonId);
  if (!salon) {
    throw buildError('Salon not found.', 'SALON_NOT_FOUND', 404);
  }

  return salon;
};

const normalizeWorkingHours = (value = {}) => {
  if (Array.isArray(value) && value.length) {
    const firstRange = value[0] || {};
    return {
      start: normalizeString(firstRange.start ?? firstRange.startTime ?? '').trim(),
      end: normalizeString(firstRange.end ?? firstRange.endTime ?? '').trim(),
    };
  }

  return {
    start: normalizeString(value.start ?? value.startTime ?? '').trim(),
    end: normalizeString(value.end ?? value.endTime ?? '').trim(),
  };
};

const normalizeServices = (value = []) => normalizeIdArray(value);

const normalizeCategory = (value = []) => {
  const categories = Array.isArray(value) ? value : [value];
  const normalized = categories.map((item) => normalizeString(item)).filter((item) => SALON_CATEGORIES.includes(item));
  return normalized.length ? Array.from(new Set(normalized)) : [SALON_CATEGORIES[0]];
};

const buildStaffPayload = async (input, existingStaff = null) => {
  const payload = { ...input };
  const name = normalizeString(payload.name ?? existingStaff?.name ?? '');
  const email = normalizeString(payload.email ?? existingStaff?.email ?? '').toLowerCase();
  const password = normalizeString(payload.password ?? '');
  const role = 'staff';
  const category = normalizeCategory(payload.category ?? existingStaff?.category ?? [SALON_CATEGORIES[0]]);
  const specialization = normalizeString(payload.specialization ?? existingStaff?.specialization ?? '');
  const profileImage = normalizeString(payload.profileImage ?? payload.profile_image ?? existingStaff?.profileImage ?? '');
  const salonIdInput = payload.salonId ?? payload.salon_id ?? existingStaff?.salonId ?? null;
  const salonId = salonIdInput ? assertObjectId(salonIdInput, 'salonId') : null;
  const workingHours = normalizeWorkingHours(payload.workingHours ?? payload.working_hours ?? existingStaff?.workingHours ?? {});
  const services = normalizeServices(payload.services ?? payload.serviceIds ?? payload.service_ids ?? existingStaff?.services ?? []);

  if (!name) {
    throw buildError('Staff name is required.', 'INVALID_STAFF_NAME', 400);
  }

  if (!email) {
    throw buildError('Staff email is required.', 'INVALID_STAFF_EMAIL', 400);
  }

  if (!existingStaff && !password) {
    throw buildError('Staff password is required.', 'INVALID_STAFF_PASSWORD', 400);
  }

  if (salonId) {
    await ensureSalonExists(salonId);
  }

  return {
    name,
    email,
    role,
    category,
    specialization,
    profileImage,
    services,
    salonId,
    workingHours,
    password,
  };
};

const syncServiceAssignments = async (staffId, previousServiceIds = [], nextServiceIds = []) => {
  const previousSet = new Set(previousServiceIds.map((id) => String(id)));
  const nextSet = new Set(nextServiceIds.map((id) => String(id)));

  const toAdd = nextServiceIds.filter((id) => !previousSet.has(String(id)));
  const toRemove = previousServiceIds.filter((id) => !nextSet.has(String(id)));

  await Promise.all([
    toAdd.length ? Service.updateMany({ _id: { $in: toAdd } }, { $addToSet: { assignedStaff: staffId } }) : Promise.resolve(),
    toRemove.length ? Service.updateMany({ _id: { $in: toRemove } }, { $pull: { assignedStaff: staffId } }) : Promise.resolve(),
  ]);
};

export const listStaff = async () => {
  const staff = await Staff.find().sort({ createdAt: -1 }).select('-password_hash -password_salt').lean({ virtuals: true });
  return sanitizeDocuments(staff, STAFF_PRIVATE_FIELDS);
};

export const createStaff = async (input) => {
  const payload = await buildStaffPayload(input);
  const existingStaff = await Staff.findOne({ email: payload.email });

  if (existingStaff) {
    throw buildError('A staff member with this email already exists.', 'STAFF_DUPLICATE_EMAIL', 409);
  }

  const staff = new Staff({
    name: payload.name,
    email: payload.email,
    role: payload.role,
    category: payload.category,
    specialization: payload.specialization,
    profileImage: payload.profileImage,
    services: payload.services,
    salonId: payload.salonId,
    workingHours: payload.workingHours,
    status: 'AA',
  });

  staff.password = payload.password;
  await staff.save();
  await syncServiceAssignments(staff._id, [], payload.services);

  if (payload.salonId) {
    await Salon.findByIdAndUpdate(payload.salonId, { $addToSet: { staff: staff._id } });
  }

  return sanitizeDocument(await Staff.findById(staff._id).select('-password_hash -password_salt').lean({ virtuals: true }), STAFF_PRIVATE_FIELDS);
};

export const updateStaff = async (staffId, input) => {
  assertObjectId(staffId, 'staffId');
  const staff = await Staff.findById(staffId);

  if (!staff) {
    throw buildError('Staff not found.', 'STAFF_NOT_FOUND', 404);
  }

  const payload = await buildStaffPayload(input, staff);
  const previousServiceIds = Array.isArray(staff.services) ? staff.services.map((item) => String(item)) : [];

  if (payload.email !== staff.email) {
    const duplicateStaff = await Staff.findOne({ email: payload.email, _id: { $ne: staffId } });
    if (duplicateStaff) {
      throw buildError('A staff member with this email already exists.', 'STAFF_DUPLICATE_EMAIL', 409);
    }
  }

  const previousSalonId = staff.salonId ? staff.salonId.toString() : '';

  staff.name = payload.name;
  staff.email = payload.email;
  staff.role = payload.role;
  staff.category = payload.category;
  staff.specialization = payload.specialization;
  staff.profileImage = payload.profileImage;
  staff.services = payload.services;
  staff.salonId = payload.salonId;
  staff.workingHours = payload.workingHours;
  staff.status = 'AA';

  if (payload.password) {
    staff.password = payload.password;
  }

  await staff.save();
  await syncServiceAssignments(staff._id, previousServiceIds, payload.services);

  const currentSalonId = payload.salonId ? String(payload.salonId) : '';
  if (previousSalonId && previousSalonId !== currentSalonId) {
    await Salon.findByIdAndUpdate(previousSalonId, { $pull: { staff: staff._id } });
  }

  if (currentSalonId) {
    await Salon.findByIdAndUpdate(currentSalonId, { $addToSet: { staff: staff._id } });
  }

  return sanitizeDocument(await Staff.findById(staff._id).select('-password_hash -password_salt').lean({ virtuals: true }), STAFF_PRIVATE_FIELDS);
};

export const deleteStaff = async (staffId) => {
  assertObjectId(staffId, 'staffId');
  const staff = await Staff.findById(staffId);

  if (!staff) {
    throw buildError('Staff not found.', 'STAFF_NOT_FOUND', 404);
  }

  await Promise.all([
    Salon.updateMany({ staff: staff._id }, { $pull: { staff: staff._id } }),
    Service.updateMany({ assignedStaff: staff._id }, { $pull: { assignedStaff: staff._id } }),
    Slot.updateMany({ stylist_id: staff._id }, { $set: { is_active: false, metadata: { source: 'admin-delete-staff' } } }),
    staff.deleteOne(),
  ]);

  return { deletedId: staffId };
};