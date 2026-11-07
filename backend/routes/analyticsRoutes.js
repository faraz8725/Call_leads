import express from 'express';
import {
  getDashboardSummary,
  getCampaignAnalytics,
  exportAnalytics
} from '../controllers/analyticsController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/dashboard', getDashboardSummary);
router.get('/campaigns', getCampaignAnalytics);
router.get('/export', exportAnalytics);

export default router;
