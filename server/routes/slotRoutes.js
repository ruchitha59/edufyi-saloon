import { Router } from 'express';
import { adminMiddleware, authMiddleware, staffMiddleware } from '../middleware/authMiddleware.js';
import { getAllSlots, getAvailableSlots, patchSlotAvailability } from '../controllers/slotController.js';

const router = Router();

router.get('/available', getAvailableSlots);
router.get('/', authMiddleware(['admin', 'staff']), getAllSlots);
router.patch('/:id/availability', adminMiddleware, patchSlotAvailability);
router.patch('/:id/availability/staff', staffMiddleware, patchSlotAvailability);

export default router;