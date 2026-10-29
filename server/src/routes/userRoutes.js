import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { updateProfileValidation, changePasswordValidation } from '../validators/authValidator.js';
import { handleValidationErrors } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.patch('/profile', updateProfileValidation, handleValidationErrors, updateProfile);
router.patch('/change-password', changePasswordValidation, handleValidationErrors, changePassword);

export default router;
