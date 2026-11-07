import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  PhoneCall,
  CheckCircle2,
  XCircle,
  PhoneIncoming,
  PhoneMissed,
  ThumbsUp,
  ThumbsDown,
  Clock,
  UserCheck,
  TrendingUp,
  Zap,
  Play,
  ArrowUpRight,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../services/api.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (sec) => {
    if (!sec) return '0m 0s';
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins}m ${remSec}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[var(--bg-card)] rounded-2xl"></div>
          <div className="h-80 bg-[var(--bg-card)] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const outcomeBreakdown = data?.outcomeBreakdown || [];
  const dailyTrends = data?.dailyTrends || [];
  const recentCalls = data?.recentCalls || [];

  // Top 12 metrics cards configured cleanly
  const statCards = [
    { label: 'Total Leads', value: metrics.totalLeads, icon: Users, color: 'from-blue-500 to-indigo-600', sub: `${metrics.dncLeads || 0} DNC Suppressed` },
    { label: 'Total Calls Dialed', value: metrics.totalCalls, icon: PhoneCall, color: 'from-indigo-500 to-purple-600', sub: 'Autonomous Outreach' },
    { label: 'Successful Calls', value: metrics.successfulCalls, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', sub: `${metrics.callSuccessRate}% Success Rate` },
    { label: 'Failed Calls', value: metrics.failedCalls, icon: XCircle, color: 'from-rose-500 to-red-600', sub: 'Busy or Unreachable' },
    { label: 'Answered Calls', value: metrics.answeredCalls, icon: PhoneIncoming, color: 'from-sky-500 to-cyan-600', sub: 'Connected Conversations' },
    { label: 'No Answer Calls', value: metrics.noAnswerCalls, icon: PhoneMissed, color: 'from-slate-500 to-zinc-600', sub: 'Pending Retry Interval' },
    { label: 'Interested Leads', value: metrics.interestedLeads, icon: ThumbsUp, color: 'from-emerald-400 to-green-600', sub: `${metrics.interestedPercentage}% Conversion` },
    { label: 'Not Interested', value: metrics.notInterestedLeads, icon: ThumbsDown, color: 'from-amber-500 to-orange-600', sub: 'Politely Disengaged' },
    { label: 'Callback Requested', value: metrics.callbackRequested, icon: Clock, color: 'from-violet-500 to-purple-600', sub: 'Scheduled Follow-ups' },
    { label: 'Human Handoff Req.', value: metrics.humanHandoffRequired, icon: UserCheck, color: 'from-fuchsia-500 to-pink-600', sub: 'Escalated to Specialist' },
    { label: 'Total Call Duration', value: formatSeconds(metrics.totalDurationSeconds), icon: TrendingUp, color: 'from-blue-600 to-indigo-700', sub: `Avg: ${metrics.avgDurationSeconds}s / call` },
    { label: 'Call Success Rate', value: `${metrics.callSuccessRate}%`, icon: Zap, color: 'from-emerald-500 to-teal-500', sub: `${metrics.activeCampaigns} Active Campaigns` }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/30 via-[var(--bg-card)] to-purple-900/20 border border-indigo-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Autonomous Voice Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mt-1 tracking-tight">
            Outbound Operations Command Center
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
            Groq Llama 3.3 conversational brain &bull; Sarvam AI Hindi/English TTS &bull; Deepgram Nova-2 STT &bull; LiveKit Real-Time WebRTC
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/add-leads')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-indigo-500 text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Leads</span>
          </button>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Campaign</span>
          </button>
        </div>
      </div>

      {/* 12 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-indigo-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-muted)] truncate">
                  {card.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {card.value}
                </span>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                  {card.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Call Volume & Conversion Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                7-Day Call Volume & Conversion
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Daily dialed calls and positive lead engagement
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Live Trend
            </span>
          </div>

          <div className="h-64 w-full">
            {dailyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No call volume data recorded in the last 7 days.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInterested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Calls Dialed"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interested"
                    name="Interested Leads"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInterested)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Call Outcome Distribution Pie Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Call Outcome Breakdown
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Distribution across AI-classified classifications
            </p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeBreakdown.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {outcomeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-[var(--border-color)]">
            {outcomeBreakdown.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-[var(--text-muted)] truncate">{item.name}:</span>
                <span className="font-bold text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Calls Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Recent Call Activity
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Real-time feed of recently completed AI calls
            </p>
          </div>
          <button
            onClick={() => navigate('/call-history')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>View All Calls</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Lead Contact</th>
                <th className="px-5 py-3">Campaign / Agent</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Interest</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {recentCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">
                    No calls recorded yet. Launch a campaign or test call to view activity.
                  </td>
                </tr>
              ) : (
                recentCalls.map((call) => (
                  <tr key={call._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {call.lead?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">
                        {call.phoneNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[var(--text-primary)] font-medium truncate max-w-[150px]">
                        {call.campaign?.name || 'Manual Test'}
                      </div>
                      <div className="text-[11px] text-indigo-400">
                        {call.agent?.name || 'AI Assistant'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        {call.status}
                      </span>
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
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {call.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <div
                            className={`h-full ${
                              call.interestScore > 70
                                ? 'bg-emerald-400'
                                : call.interestScore > 40
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${call.interestScore || 50}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">
                          {call.interestScore || 50}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-secondary)]">
                      {call.duration}s
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/calls/${call._id}`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600/25 border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        Transcript & Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
