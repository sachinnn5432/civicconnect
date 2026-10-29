import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  reopenComplaint,
  trackPublicComplaint
} from '../controllers/complaintController.js';
import {
  createComplaintValidation,
  reopenComplaintValidation
} from '../validators/complaintValidator.js';
import { handleValidationErrors } from '../middleware/validate.js';
import { authenticateToken, requireCitizen } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = Router();

// Public tracking endpoint (no auth required)
router.get('/track/:ref', trackPublicComplaint);

// Authenticated citizen routes
router.use(authenticateToken);

router.post(
  '/',
  requireCitizen,
  uploadAttachment.single('attachment'),
  createComplaintValidation,
  handleValidationErrors,
  createComplaint
);

router.get('/my', requireCitizen, getMyComplaints);
router.get('/:id', getComplaintById);
router.post(
  '/:id/reopen',
  requireCitizen,
  reopenComplaintValidation,
  handleValidationErrors,
  reopenComplaint
);

export default router;
