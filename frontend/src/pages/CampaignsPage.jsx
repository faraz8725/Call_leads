import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PhoneCall,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import api from '../services/api.js';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      if (res.data.success) {
        setCampaigns(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id) => {
    try {
      await api.post(`/campaigns/${id}/start`);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start campaign');
    }
  };

  const handlePause = async (id) => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause campaign');
    }
  };

  const handleStop = async (id) => {
    if (!window.confirm('Are you sure you want to completely stop this campaign?')) return;
    try {
      await api.post(`/campaigns/${id}/stop`);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to stop campaign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this campaign record?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Outbound Calling Campaigns
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Orchestrate automated voice dialing, monitor queue concurrency, and track live conversion rates
          </p>
        </div>

        <button
          onClick={() => navigate('/campaigns/new')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-48 bg-[var(--bg-card)] rounded-3xl"></div>
          <div className="h-48 bg-[var(--bg-card)] rounded-3xl"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Campaigns Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-4">
            Build your first AI outbound calling campaign using our step-by-step wizard.
          </p>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
          >
            Launch Campaign Wizard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const stats = camp.stats || {};
            const totalLeads = camp.leads?.length || stats.totalLeads || 0;
            const processed = stats.processedLeads || 0;
            const progressPercent = totalLeads > 0 ? Math.round((processed / totalLeads) * 100) : 0;

            const isRunning = camp.status === 'Running';
            const isPaused = camp.status === 'Paused';

            return (
              <div
                key={camp._id}
                className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isRunning
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isPaused
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : camp.status === 'Completed'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                          }`}
                        >
                          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>}
                          {camp.status}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          Concurrency: {camp.concurrencyLimit || 5} lines
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] mt-1.5">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                        {camp.description || 'AI outbound voice qualification sequence'}
                      </p>
                    </div>

                    {/* Agent Pill */}
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-indigo-400 block uppercase">
                        AI Agent
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {camp.agent?.name?.split(' - ')[0] || 'AI Assistant'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--text-muted)]">Campaign Execution Progress</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {processed} / {totalLeads} Leads ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 mt-5 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Interested</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {stats.interestedCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Callbacks</span>
                      <span className="font-extrabold text-amber-400 text-sm">
                        {stats.callbackCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Handoffs</span>
                      <span className="font-extrabold text-purple-400 text-sm">
                        {stats.humanHandoffCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Calling Hrs</span>
                      <span className="font-mono text-[var(--text-primary)] text-xs">
                        {camp.callingHoursStart || '09:00'}-{camp.callingHoursEnd || '19:00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Control Buttons Footer */}
                <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isRunning ? (
                      <button
                        onClick={() => handlePause(camp._id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Dialer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStart(camp._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{isPaused ? 'Resume Dialer' : 'Start Campaign'}</span>
                      </button>
                    )}

                    {(isRunning || isPaused) && (
                      <button
                        onClick={() => handleStop(camp._id)}
                        className="p-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-rose-500/10 hover:text-rose-400 text-[var(--text-muted)] border border-[var(--border-color)] transition-all cursor-pointer"
                        title="Stop Campaign"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(camp._id)}
                      className="text-xs text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate('/live-calls')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Monitor Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
