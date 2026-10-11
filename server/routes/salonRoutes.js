import { Router } from 'express';
import { listSalons, getSalonById, getSalonStylists, getSalonSlots } from '../controllers/salonController.js';

const router = Router();

router.get('/', listSalons);
router.get('/:id', getSalonById);
router.get('/:id/stylists', getSalonStylists);
router.get('/:id/slots', getSalonSlots);

export default router;
