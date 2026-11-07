import express from 'express';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  testKnowledgeQuery
} from '../controllers/knowledgeBaseController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getArticles);
router.post('/', createArticle);
router.post('/test-query', testKnowledgeQuery);
router.get('/:id', getArticleById);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

export default router;
