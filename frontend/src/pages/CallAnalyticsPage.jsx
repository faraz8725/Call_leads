import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  Download,
  TrendingUp,
  Percent,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  Megaphone,
  Bot
} from 'lucide-react';
import api from '../services/api.js';

export default function CallAnalyticsPage() {
  const [data, setData] = useState(null);
  const [campaignData, setCampaignData] = useState([]);
  const [agentData, setAgentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashRes, campRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/campaigns')
        ]);

        if (dashRes.data.success) {
          setData(dashRes.data.data);
        }
        if (campRes.data.success) {
          setCampaignData(campRes.data.data.campaignPerformance || []);
          setAgentData(campRes.data.data.agentStats || []);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/analytics/export', '_blank');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Computing multi-dimensional voice analytics...
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const outcomeBreakdown = data?.outcomeBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Comprehensive Voice Intelligence & Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Conversion rates, agent throughput, call duration metrics, and telephony performance
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)] font-medium">Interested Lead %</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {metrics.interestedPercentage || 0}%
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">Conversion to Qualified</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)] font-medium">Connection Rate</span>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">
            {metrics.callSuccessRate || 0}%
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">Successful carrier answer</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)] font-medium">Avg Call Duration</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
            {metrics.avgDurationSeconds || 0}s
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">Engagement duration</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)] font-medium">Human Handoffs</span>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">
            {metrics.humanHandoffRequired || 0}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">Senior rep follow-ups</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Comparative Bar Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
            Campaign Comparison: Total Calls vs Interested
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Volume and qualification distribution per outbound campaign
          </p>

          <div className="h-64 w-full">
            {campaignData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No campaign data to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="totalCalls" name="Total Dialed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interested" name="Interested" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Failed Calls Analysis Pie Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Call Disconnect & Failure Breakdown
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Analysis of unanswered, busy, and disengaged phone sessions
            </p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeBreakdown.filter((o) => ['Not Interested', 'No Answer', 'Failed / Busy'].includes(o.name))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#64748b" />
                  <Cell fill="#f43f5e" />
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

          <div className="text-xs text-[var(--text-secondary)] p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex justify-around text-center">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Not Interested</span>
              <span className="font-bold text-rose-400">{metrics.notInterestedLeads || 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">No Answer</span>
              <span className="font-bold text-slate-400">{metrics.noAnswerCalls || 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Busy / Network Fail</span>
              <span className="font-bold text-red-400">{metrics.failedCalls || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agent Performance Comparison Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            AI Voice Agent Performance Comparison
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Benchmark personality models, speaking styles, and average conversion metrics
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Agent Model</th>
                <th className="px-5 py-3.5">Language & Voice</th>
                <th className="px-5 py-3.5">Total Handled</th>
                <th className="px-5 py-3.5">Interested Leads</th>
                <th className="px-5 py-3.5">Conversion %</th>
                <th className="px-5 py-3.5">Avg Interest Score</th>
                <th className="px-5 py-3.5">Total Talk Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {agentData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">
                    No agent calls logged yet.
                  </td>
                </tr>
              ) : (
                agentData.map((ag, i) => {
                  const rate =
                    ag.callsCount > 0 ? Math.round((ag.interestedCount / ag.callsCount) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-[var(--bg-hover)]">
                      <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                        {ag.agentInfo?.name || 'Default AI Agent'}
                      </td>
                      <td className="px-5 py-3 font-mono uppercase text-indigo-400">
                        {ag.agentInfo?.language || 'en'} ({ag.agentInfo?.voiceId || 'meera'})
                      </td>
                      <td className="px-5 py-3 font-mono">{ag.callsCount} calls</td>
                      <td className="px-5 py-3 font-mono font-bold text-emerald-400">
                        {ag.interestedCount}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-[var(--text-primary)]">
                        {rate}%
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-indigo-400">
                        {Math.round(ag.avgScore || 50)}/100
                      </td>
                      <td className="px-5 py-3 font-mono text-[var(--text-secondary)]">
                        {Math.round(ag.totalSeconds || 0)}s
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
