import { Router } from 'express';
import { staffMiddleware } from '../middleware/authMiddleware.js';
import { getStaffAppointments, getStaffServices, patchStaffAppointmentStatus } from '../controllers/staffController.js';

const router = Router();

router.use(staffMiddleware);

router.get('/appointments', getStaffAppointments);
router.get('/services', getStaffServices);
router.patch('/appointments/:id/status', patchStaffAppointmentStatus);

export default router;
