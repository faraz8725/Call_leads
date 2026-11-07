import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Download
} from 'lucide-react';
import api from '../services/api.js';

export default function CallHistoryPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [handoffFilter, setHandoffFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const navigate = useNavigate();

  const fetchCalls = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/calls', {
        params: {
          page,
          limit: pagination.limit,
          search: search || undefined,
          outcome: outcomeFilter !== 'All' ? outcomeFilter : undefined,
          handoff: handoffFilter !== '' ? handoffFilter : undefined
        }
      });
      if (res.data.success) {
        setCalls(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls(pagination.page);
  }, [pagination.page, outcomeFilter, handoffFilter]);

  const handleExport = () => {
    window.open('/api/analytics/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Call History & Transcripts ({pagination.total})
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Complete archive of all outbound interactions, classified outcomes, and conversational transcripts
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500 text-xs font-semibold text-[var(--text-primary)] flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Call Logs (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCalls(1);
          }}
          className="flex-1 min-w-[240px] relative"
        >
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone number..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Call Outcomes</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Callback Requested">Callback Requested</option>
            <option value="Human Handoff Requested">Human Handoff Requested</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed / Busy</option>
          </select>

          <select
            value={handoffFilter}
            onChange={(e) => setHandoffFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Handoff States</option>
            <option value="true">Human Handoff Required</option>
          </select>
        </div>
      </div>

      {/* Call History Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Lead Contact</th>
                <th className="px-5 py-3.5">Campaign & Agent</th>
                <th className="px-5 py-3.5">Call Outcome</th>
                <th className="px-5 py-3.5">Sentiment</th>
                <th className="px-5 py-3.5">Interest Score</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-[var(--text-muted)]">
                    Loading call archive...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-[var(--text-muted)]">
                    No historical calls found.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {call.lead?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">
                        {call.phoneNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[var(--text-primary)] font-medium truncate max-w-[140px]">
                        {call.campaign?.name || 'Manual Dialer'}
                      </div>
                      <div className="text-[11px] text-indigo-400">
                        {call.agent?.name?.split(' - ')[0] || 'AI Assistant'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          call.outcome === 'Interested'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : call.outcome === 'Human Handoff Requested'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : call.outcome === 'Callback Requested'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : call.outcome === 'Not Interested'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {call.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-semibold ${
                          call.sentiment === 'Positive'
                            ? 'text-emerald-400'
                            : call.sentiment === 'Negative'
                            ? 'text-rose-400'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {call.sentiment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[var(--text-primary)]">
                      {call.interestScore || 50}%
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-secondary)]">
                      {call.duration || 0}s
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-[11px]">
                      {call.startTime ? new Date(call.startTime).toLocaleString() : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/calls/${call._id}`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Showing page {pagination.page} of {pagination.pages || 1}
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
    </div>
  );
}
