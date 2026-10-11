import { Router } from 'express';
import { createBooking, getBookingsForCustomer } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', protect, createBooking);
router.get('/customer/:customerId', protect, getBookingsForCustomer);

export default router;
