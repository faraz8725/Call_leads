import express from 'express';
import {
  login,
  getMe,
  logout,
  updateProfile,
  forgotPassword
} from '../controllers/authController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', protectAdmin, logout);
router.get('/me', protectAdmin, getMe);
router.put('/profile', protectAdmin, updateProfile);
router.post('/forgot-password', forgotPassword);

export default router;
