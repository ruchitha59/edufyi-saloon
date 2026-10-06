import { authMiddleware, adminMiddleware, staffMiddleware } from '../middleware/authMiddleware.js';
import { listSlots, updateSlotAvailability } from '../services/admin/slotService.js';

const send = (response, statusCode, data, message) => {
  const payload = { success: true, data };

  if (message) {
    payload.message = message;
  }

  return response.status(statusCode).json(payload);
};

export const getAvailableSlots = async (request, response, next) => {
  try {
    return send(
      response,
      200,
      await listSlots(
        {
          date: request.query.date,
          stylistId: request.query.stylistId,
          salonId: request.query.salonId,
          includeAll: request.query.includeAll,
          availableOnly: request.query.availableOnly,
        },
        ''
      )
    );
  } catch (error) {
    return next(error);
  }
};

export const getAllSlots = async (request, response, next) => {
  try {
    const staffScopedStylistId = request.role === 'staff' && !request.query.stylistId ? request.user?._id : request.query.stylistId;
    return send(
      response,
      200,
      await listSlots(
        {
          date: request.query.date,
          stylistId: staffScopedStylistId,
          salonId: request.query.salonId,
          status: request.query.status,
          includeAll: request.query.includeAll,
        },
        request.role
      )
    );
  } catch (error) {
    return next(error);
  }
};

export const patchSlotAvailability = async (request, response, next) => {
  try {
    return send(response, 200, await updateSlotAvailability(request.params.id, request.body), 'Slot availability updated successfully.');
  } catch (error) {
    return next(error);
  }
};