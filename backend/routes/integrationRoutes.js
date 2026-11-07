import express from 'express';
import {
  getIntegrationStatuses,
  updateIntegrationCredentials,
  testIntegration
} from '../controllers/integrationController.js';
import { protectAdmin, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getIntegrationStatuses);
router.post('/update', authorizeRoles('superadmin', 'admin'), updateIntegrationCredentials);
router.post('/test/:provider', testIntegration);

export default router;
