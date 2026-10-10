import { Router } from 'express';
import { adminMiddleware } from '../middleware/authMiddleware.js';
import {
	addService,
	addSlots,
	addStaff,
	assignSlot,
	disableSlot,
	editBookingStatus,
	editSalonDetails,
	editSalonSlotTimings,
	editSalonWorkingHours,
	editService,
	editStaff,
	getAllBookings,
	getAllServices,
	getAllStaff,
	removeService,
	removeStaff,
	toggleServiceStatus,
} from '../controllers/adminController.js';

const router = Router();

router.use(adminMiddleware);

router.get('/staff', getAllStaff);
router.post('/staff', addStaff);
router.put('/staff/:id', editStaff);
router.delete('/staff/:id', removeStaff);

router.get('/services', getAllServices);
router.post('/services', addService);
router.put('/services/:id', editService);
router.delete('/services/:id', removeService);
router.patch('/services/:id/toggle', toggleServiceStatus);

router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', editBookingStatus);

router.put('/salons/:id', editSalonDetails);
router.patch('/salons/:id/working-hours', editSalonWorkingHours);
router.patch('/salons/:id/slot-timings', editSalonSlotTimings);

router.post('/slots', addSlots);
router.patch('/slots/:id/assign', assignSlot);
router.patch('/slots/:id/disable', disableSlot);

export default router;
