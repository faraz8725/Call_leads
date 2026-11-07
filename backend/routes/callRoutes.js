import express from 'express';
import {
  getCalls,
  getLiveCalls,
  getCallById,
  initiateCall,
  hangupCall
} from '../controllers/callController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getCalls);
router.get('/live', getLiveCalls);
router.post('/initiate', initiateCall);
router.get('/:id', getCallById);
router.post('/:id/hangup', hangupCall);

export default router;
