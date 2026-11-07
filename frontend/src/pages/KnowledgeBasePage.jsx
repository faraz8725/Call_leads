import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Tag,
  X,
  Send
} from 'lucide-react';
import api from '../services/api.js';

const categories = [
  { id: 'All', label: 'All Knowledge' },
  { id: 'company', label: 'Company Overview' },
  { id: 'product', label: 'Product & AI Voice' },
  { id: 'pricing', label: 'Pricing & Plans' },
  { id: 'faq', label: 'Common FAQs' },
  { id: 'services', label: 'CRM & Telephony' },
  { id: 'sales', label: 'Objection Handling' },
  { id: 'custom', label: 'Custom Instructions' }
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'faq',
    content: '',
    keywords: '',
    priority: 5
  });

  // Test Query State
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testingQuery, setTestingQuery] = useState(false);

  const fetchArticles = async () => {
    try {
      const res = await api.get('/knowledge-base', {
        params: {
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setArticles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load KB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [categoryFilter]);

  const handleOpenModal = (art = null) => {
    if (art) {
      setEditingArticle(art);
      setFormData({
        title: art.title,
        category: art.category,
        content: art.content,
        keywords: (art.keywords || []).join(', '),
        priority: art.priority || 5
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        category: 'faq',
        content: '',
        keywords: '',
        priority: 5
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await api.put(`/knowledge-base/${editingArticle._id}`, formData);
      } else {
        await api.post('/knowledge-base', formData);
      }
      setShowModal(false);
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving article');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this knowledge base entry?')) return;
    try {
      await api.delete(`/knowledge-base/${id}`);
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting article');
    }
  };

  const handleTestQuery = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTestingQuery(true);
    setTestResult('');

    try {
      const res = await api.post('/knowledge-base/test-query', { query: testQuery });
      if (res.data.success) {
        setTestResult(res.data.retrievedContext);
      }
    } catch (err) {
      setTestResult('Failed to evaluate knowledge retrieval.');
    } finally {
      setTestingQuery(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Knowledge Base & Facts Repository
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Official company documentation injected dynamically into Groq LLM to prevent hallucinations
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Entry</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchArticles();
          }}
          className="relative w-full md:w-72"
        >
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords or titles..."
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Interactive Retrieval Evaluator */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-900/20 via-[var(--bg-card)] to-purple-900/20 border border-indigo-500/20 shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Test Knowledge Retrieval (Agent Brain Evaluator)
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Type any sample caller inquiry to inspect which facts will be injected into Groq before speech generation.
        </p>

        <form onSubmit={handleTestQuery} className="flex space-x-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="e.g. How much does a minute of outbound calling cost?"
            className="flex-1 px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={testingQuery}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {testingQuery ? 'Retrieving...' : 'Evaluate Context'}
          </button>
        </form>

        {testResult && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-indigo-500/30 text-xs text-[var(--text-primary)] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {testResult}
          </div>
        )}
      </div>

      {/* Knowledge Articles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading knowledge articles...</div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <BookOpen className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Knowledge Entries Found</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add official product facts, pricing tables, or sales objection scripts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((art) => (
            <div
              key={art._id}
              className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Priority: {art.priority || 1}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                  {art.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                  {art.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center space-x-1 overflow-hidden">
                  <Tag className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                  <span className="text-[10px] text-[var(--text-muted)] truncate">
                    {(art.keywords || []).slice(0, 3).join(', ')}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenModal(art)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-indigo-400 rounded-lg"
                    title="Edit Entry"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(art._id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-rose-400 rounded-lg"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {editingArticle ? 'Edit Knowledge Entry' : 'New Knowledge Base Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Entry Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Enterprise Pay-As-You-Go Rates"
                  required
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                  >
                    <option value="company">Company</option>
                    <option value="product">Product</option>
                    <option value="pricing">Pricing</option>
                    <option value="faq">FAQ</option>
                    <option value="services">Services</option>
                    <option value="sales">Sales</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Keywords for Retrieval (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="pricing, plans, cost, rates, discount"
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Document Content / Official Facts *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  placeholder="State the exact facts. The AI will strictly reference this information when answering caller queries."
                  required
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
