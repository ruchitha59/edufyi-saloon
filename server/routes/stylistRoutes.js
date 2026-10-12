import { Router } from 'express';
import {
  getStylists,
  getStylistById,
  getStylistCertifications,
  getStylistGallery,
} from '../controllers/stylistController.js';

const router = Router();

router.get('/', getStylists);
router.get('/:id', getStylistById);
router.get('/:id/certifications', getStylistCertifications);
router.get('/:id/gallery', getStylistGallery);

export default router;