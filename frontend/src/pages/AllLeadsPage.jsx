import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  PhoneCall,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X
} from 'lucide-react';
import api from '../services/api.js';

export default function AllLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [dncFilter, setDncFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);

  // Campaign assignment modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignsList, setCampaignsList] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Edit lead modal
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phoneNumber: '', email: '', company: '', location: '', notes: '' });

  const navigate = useNavigate();

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        params: {
          page,
          limit: pagination.limit,
          search: search || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          outcome: outcomeFilter !== 'All' ? outcomeFilter : undefined,
          isDNC: dncFilter !== '' ? dncFilter : undefined
        }
      });
      if (res.data.success) {
        setLeads(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(pagination.page);
  }, [pagination.page, statusFilter, outcomeFilter, dncFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(leads.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleDNC = async (leadId) => {
    try {
      const res = await api.post(`/leads/${leadId}/toggle-dnc`);
      if (res.data.success) {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, isDNC: res.data.isDNC } : l))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating DNC status');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l._id !== leadId));
      setSelectedIds((prev) => prev.filter((id) => id !== leadId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting lead');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected leads?`)) return;
    try {
      await api.post('/leads/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting leads');
    }
  };

  const openCampaignModal = async () => {
    try {
      const res = await api.get('/campaigns');
      if (res.data.success) {
        setCampaignsList(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedCampaignId(res.data.data[0]._id);
        }
      }
      setShowCampaignModal(true);
    } catch (err) {
      alert('Error fetching campaigns list');
    }
  };

  const handleAssignToCampaign = async () => {
    if (!selectedCampaignId) return;
    setAssigning(true);
    try {
      const res = await api.post('/leads/add-to-campaign', {
        leadIds: selectedIds,
        campaignId: selectedCampaignId
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowCampaignModal(false);
        setSelectedIds([]);
        fetchLeads(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning leads');
    } finally {
      setAssigning(false);
    }
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name,
      phoneNumber: lead.phoneNumber,
      email: lead.email || '',
      company: lead.company || '',
      location: lead.location || '',
      notes: lead.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/leads/${editingLead._id}`, editForm);
      if (res.data.success) {
        setLeads((prev) =>
          prev.map((l) => (l._id === editingLead._id ? res.data.data : l))
        );
        setEditingLead(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update lead');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            All Contact Leads ({pagination.total})
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Search, filter consent, manage DNC suppression, and dispatch contacts to calling campaigns
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={openCampaignModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Add Selected ({selectedIds.length}) to Campaign</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/add-leads')}
            className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500 text-xs font-semibold text-[var(--text-primary)] flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Leads</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or company..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Lead Statuses</option>
            <option value="New">New</option>
            <option value="In Campaign">In Campaign</option>
            <option value="Completed">Completed</option>
            <option value="Unreachable">Unreachable</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Call Outcomes</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Callback Requested">Callback Requested</option>
            <option value="Human Handoff Requested">Human Handoff</option>
            <option value="None">Never Called</option>
          </select>

          {/* DNC Suppression Filter */}
          <select
            value={dncFilter}
            onChange={(e) => setDncFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Consent States</option>
            <option value="false">Callable (Not DNC)</option>
            <option value="true">DNC Suppressed</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === leads.length && leads.length > 0}
                    className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="px-4 py-3.5">Lead Details</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Outcome</th>
                <th className="px-4 py-3.5">Interest</th>
                <th className="px-4 py-3.5">DNC Suppression</th>
                <th className="px-4 py-3.5">Attempts</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-xs text-[var(--text-muted)]">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>Loading verified leads database...</div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-xs text-[var(--text-muted)]">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead._id)}
                        onChange={() => toggleSelectOne(lead._id)}
                        className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--text-primary)]">{lead.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {lead.company ? `${lead.company} • ` : ''}
                        {lead.location || 'Location unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-indigo-400">
                      {lead.phoneNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.lastCallOutcome === 'Interested'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : lead.lastCallOutcome === 'Human Handoff Requested'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : lead.lastCallOutcome === 'Callback Requested'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : lead.lastCallOutcome === 'Not Interested'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {lead.lastCallOutcome || 'Never Called'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[var(--text-primary)]">
                      {lead.interestScore ? `${lead.interestScore}%` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleDNC(lead._id)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          lead.isDNC
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                        title="Click to toggle Do Not Call (DNC) status"
                      >
                        {lead.isDNC ? (
                          <>
                            <ShieldAlert className="w-3 h-3" />
                            <span>DNC Suppressed</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>Callable</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                      {lead.attemptsCount} / 3
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(lead)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Page {pagination.page} of {pagination.pages || 1} ({pagination.total} leads total)
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add To Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Assign {selectedIds.length} Leads to Campaign
              </h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Select Active or Draft Campaign
              </label>
              {campaignsList.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)]">No campaigns available. Create one first.</div>
              ) : (
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                >
                  {campaignsList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="pt-3 border-t border-[var(--border-color)] flex justify-end space-x-2">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignToCampaign}
                disabled={assigning || !selectedCampaignId}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Lead Details</h3>
              <button onClick={() => setEditingLead(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
