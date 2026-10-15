import Service from '../../models/Service.js';
import Salon from '../../models/Salon.js';
import Staff from '../../models/Staff.js';
import { assertObjectId, buildError, normalizeIdArray, normalizeString, sanitizeDocument, sanitizeDocuments } from './common.js';

const ensureSalonExists = async (salonId) => {
  const salon = await Salon.findById(salonId);
  if (!salon) {
    throw buildError('Salon not found.', 'SALON_NOT_FOUND', 404);
  }

  return salon;
};

const ensureAssignedStaffBelongToSalon = async (staffIds = [], salonId) => {
  if (!staffIds.length) {
    return;
  }

  const count = await Staff.countDocuments({ _id: { $in: staffIds.map((id) => assertObjectId(id, 'staffId')) }, salonId });
  if (count !== staffIds.length) {
    throw buildError('One or more assigned staff members do not belong to the selected salon.', 'STAFF_SALON_MISMATCH', 400);
  }
};

const buildServicePayload = async (input, existingService = null) => {
  const payload = { ...input };
  const serviceName = normalizeString(payload.serviceName ?? payload.service_name ?? existingService?.serviceName ?? '');
  const duration = normalizeString(payload.duration ?? existingService?.duration ?? '');
  const price = Number.isFinite(Number(payload.price ?? existingService?.price)) ? Number(payload.price ?? existingService?.price) : 0;
  const salonIdInput = payload.salonId ?? payload.salon_id ?? existingService?.salonId ?? '';
  const salonId = assertObjectId(salonIdInput, 'salonId');
  const assignedStaff = normalizeIdArray(payload.assignedStaff ?? payload.assigned_staff ?? existingService?.assignedStaff ?? []);
  const active = typeof payload.active === 'boolean' ? payload.active : existingService?.active ?? true;

  if (!serviceName) {
    throw buildError('Service name is required.', 'INVALID_SERVICE_NAME', 400);
  }

  if (!duration) {
    throw buildError('Service duration is required.', 'INVALID_SERVICE_DURATION', 400);
  }

  if (price < 0) {
    throw buildError('Service price cannot be negative.', 'INVALID_SERVICE_PRICE', 400);
  }

  await ensureSalonExists(salonId);
  await ensureAssignedStaffBelongToSalon(assignedStaff, salonId);

  return { serviceName, duration, price, salonId, assignedStaff, active };
};

const syncStaffServiceReferences = async (previousStaffIds = [], nextStaffIds = [], serviceId) => {
  const previousSet = new Set(previousStaffIds.map((id) => String(id)));
  const nextSet = new Set(nextStaffIds.map((id) => String(id)));

  const toAdd = nextStaffIds.filter((id) => !previousSet.has(String(id)));
  const toRemove = previousStaffIds.filter((id) => !nextSet.has(String(id)));

  await Promise.all([
    toAdd.length ? Staff.updateMany({ _id: { $in: toAdd } }, { $addToSet: { services: serviceId } }) : Promise.resolve(),
    toRemove.length ? Staff.updateMany({ _id: { $in: toRemove } }, { $pull: { services: serviceId } }) : Promise.resolve(),
  ]);
};

export const listServices = async (filters = {}) => {
  const query = {};

  if (filters.salonId) {
    query.salonId = assertObjectId(filters.salonId, 'salonId');
  }

  if (filters.active !== undefined) {
    query.active = filters.active === 'true' || filters.active === true;
  }

  const services = await Service.find(query).sort({ createdAt: -1 }).populate('salonId').populate('assignedStaff').lean();
  return sanitizeDocuments(services);
};

export const createService = async (input) => {
  const payload = await buildServicePayload(input);
  const service = await Service.create(payload);

  await Salon.findByIdAndUpdate(payload.salonId, { $addToSet: { services: service._id } });
  await syncStaffServiceReferences([], payload.assignedStaff, service._id);

  const createdService = sanitizeDocument(await Service.findById(service._id).populate('salonId').populate('assignedStaff').lean());
  return createdService;
};

export const updateService = async (serviceId, input) => {
  assertObjectId(serviceId, 'serviceId');
  const service = await Service.findById(serviceId);

  if (!service) {
    throw buildError('Service not found.', 'SERVICE_NOT_FOUND', 404);
  }

  const previousSalonId = service.salonId ? service.salonId.toString() : '';
  const previousAssignedStaffIds = Array.isArray(service.assignedStaff) ? service.assignedStaff.map((item) => String(item)) : [];
  const payload = await buildServicePayload(input, service);

  service.serviceName = payload.serviceName;
  service.duration = payload.duration;
  service.price = payload.price;
  service.salonId = payload.salonId;
  service.assignedStaff = payload.assignedStaff;
  service.active = payload.active;

  await service.save();
  await syncStaffServiceReferences(previousAssignedStaffIds, payload.assignedStaff, service._id);

  const nextSalonId = String(payload.salonId);
  if (previousSalonId && previousSalonId !== nextSalonId) {
    await Salon.findByIdAndUpdate(previousSalonId, { $pull: { services: service._id } });
  }

  await Salon.findByIdAndUpdate(nextSalonId, { $addToSet: { services: service._id } });

  const updatedService = sanitizeDocument(await Service.findById(service._id).populate('salonId').populate('assignedStaff').lean());
  return updatedService;
};

export const deleteService = async (serviceId) => {
  assertObjectId(serviceId, 'serviceId');
  const service = await Service.findById(serviceId);

  if (!service) {
    throw buildError('Service not found.', 'SERVICE_NOT_FOUND', 404);
  }

  await Promise.all([
    Salon.updateMany({ services: service._id }, { $pull: { services: service._id } }),
    Staff.updateMany({ services: service._id }, { $pull: { services: service._id } }),
    service.deleteOne(),
  ]);

  return { deletedId: serviceId };
};

export const toggleServiceAvailability = async (serviceId, input = {}) => {
  assertObjectId(serviceId, 'serviceId');
  const service = await Service.findById(serviceId);

  if (!service) {
    throw buildError('Service not found.', 'SERVICE_NOT_FOUND', 404);
  }

  if (typeof input.active === 'boolean') {
    service.active = input.active;
  } else {
    service.active = !service.active;
  }

  await service.save();

  return sanitizeDocument(await Service.findById(service._id).populate('salonId').populate('assignedStaff').lean());
};