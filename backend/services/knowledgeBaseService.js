import KnowledgeBase from '../models/KnowledgeBase.js';

class KnowledgeBaseService {
  async getAll(category = null, search = '') {
    const query = { isActive: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    return await KnowledgeBase.find(query).sort({ priority: -1, createdAt: -1 });
  }

  async create(data, adminId) {
    return await KnowledgeBase.create({
      ...data,
      createdBy: adminId
    });
  }

  async update(id, data) {
    return await KnowledgeBase.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await KnowledgeBase.findByIdAndDelete(id);
  }

  /**
   * Retrieves compiled knowledge context for prompt injection
   */
  async getCompiledContextForAgent(keywords = []) {
    const entries = await KnowledgeBase.find({ isActive: true }).sort({ priority: -1 }).limit(10);
    if (!entries || entries.length === 0) return '';

    return entries
      .map((e) => `[${e.category.toUpperCase()}] ${e.title}:\n${e.content}`)
      .join('\n\n');
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;
