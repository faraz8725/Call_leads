import KnowledgeBase from '../models/KnowledgeBase.js';
import conversationalVoiceAgent from '../agents/conversationalVoiceAgent.js';

export const getArticles = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const articles = await KnowledgeBase.find(query).sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: articles
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const { title, category, content, keywords, priority, isActive } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, Category, and Content are required.'
      });
    }

    const article = await KnowledgeBase.create({
      title: title.trim(),
      category,
      content,
      keywords: Array.isArray(keywords) ? keywords : (keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      priority: priority || 1,
      isActive: isActive !== false,
      createdBy: req.admin?._id
    });

    res.status(201).json({
      success: true,
      message: 'Knowledge entry added successfully',
      data: article
    });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const { title, category, content, keywords, priority, isActive } = req.body;

    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (title) article.title = title.trim();
    if (category) article.category = category;
    if (content) article.content = content;
    if (keywords !== undefined) {
      article.keywords = Array.isArray(keywords) ? keywords : String(keywords).split(',').map((k) => k.trim()).filter(Boolean);
    }
    if (priority !== undefined) article.priority = priority;
    if (isActive !== undefined) article.isActive = isActive;

    await article.save();

    res.status(200).json({
      success: true,
      message: 'Knowledge entry updated successfully',
      data: article
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Knowledge entry removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const testKnowledgeQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const retrievedContext = await conversationalVoiceAgent.retrieveKnowledge(query);

    res.status(200).json({
      success: true,
      retrievedContext: retrievedContext || 'No matching knowledge base entry found for this query.'
    });
  } catch (error) {
    next(error);
  }
};
