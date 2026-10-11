import { Router } from 'express';
import { registerCustomer, sendOtp, staffAdminLogin, verifyOtp } from '../controllers/authController.js';

const router = Router();

router.post('/login', sendOtp);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/staff-admin-login', staffAdminLogin);
router.post('/register', registerCustomer);

export default router;