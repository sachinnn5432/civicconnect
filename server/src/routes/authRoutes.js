import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { handleValidationErrors } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);

export default router;
