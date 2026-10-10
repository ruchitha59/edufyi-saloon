import { Router } from 'express';
import { createAppointment, getAppointmentById, markPaymentFailed, updateAppointment } from '../controllers/appointmentController.js';

const router = Router();

router.post('/', createAppointment);
router.post('/:id/payment-failed', markPaymentFailed);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);

export default router;
