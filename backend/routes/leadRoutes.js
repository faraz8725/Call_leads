import express from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
  toggleDNC,
  previewImport,
  commitImport,
  addLeadsToCampaign
} from '../controllers/leadController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getLeads);
router.post('/', createLead);
router.post('/bulk-delete', bulkDeleteLeads);
router.post('/preview-import', upload.single('file'), previewImport);
router.post('/commit-import', commitImport);
router.post('/add-to-campaign', addLeadsToCampaign);

router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/toggle-dnc', toggleDNC);

export default router;
