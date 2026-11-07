import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Radio,
  ShieldCheck,
  Zap,
  Play,
  Key,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Bot
} from 'lucide-react';
import api from '../services/api.js';

export default function PhoneTelephonySettingsPage() {
  const [callerId, setCallerId] = useState('+18005550199');
  const [copied, setCopied] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [dialing, setDialing] = useState(false);
  const [dialResult, setDialResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const webhookUrl = `${window.location.origin}/api/webhooks/vobiz`;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await api.get('/agents');
        if (res.data.success && res.data.data.length > 0) {
          setAgents(res.data.data);
          setSelectedAgentId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInitiateTestCall = async (e) => {
    e.preventDefault();
    if (!testPhone.trim() || !selectedAgentId) return;

    setDialing(true);
    setError('');
    setDialResult(null);

    try {
      // First ensure a lead exists or create a test lead for this number
      const leadRes = await api.post('/leads', {
        name: 'Manual Test Recipient',
        phoneNumber: testPhone.trim(),
        company: 'Telephony Test Probe',
        notes: 'Initiated via live outbound test dialer'
      }).catch((err) => {
        // If duplicate, fetch existing
        return null;
      });

      let leadId = leadRes?.data?.data?._id;
      if (!leadId) {
        // Find existing lead by phone
        const existing = await api.get('/leads', { params: { search: testPhone.trim() } });
        leadId = existing.data.data[0]?._id;
      }

      if (!leadId) {
        throw new Error('Unable to register test lead for this phone number.');
      }

      const callRes = await api.post('/calls/initiate', {
        leadId,
        agentId: selectedAgentId
      });

      if (callRes.data.success) {
        setDialResult(callRes.data.data);
        // Automatically take them to live calls after 1.5 seconds
        setTimeout(() => {
          navigate('/live-calls');
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Call initiation failed');
    } finally {
      setDialing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Phone & Outbound Telephony Configuration
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Manage Vobiz carrier SIP trunking, outbound caller ID masks, webhook endpoints, and test dialing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Carrier Details & Webhooks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carrier Status Card */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Vobiz Telephony Provider
                </h3>
              </div>
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                SIP Trunk Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">
                  Default Outbound Caller ID
                </span>
                <span className="text-sm font-mono font-bold text-indigo-400 mt-1 block">
                  {callerId}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">
                  Carrier Audio Engine
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  LiveKit WebRTC Low-Latency Bridge
                </span>
              </div>
            </div>

            {/* Webhook Callback Box */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Carrier Status Webhook URL (Paste into Vobiz Console)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-3.5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Vobiz sends real-time callbacks to this endpoint for answered, busy, completed, and recording events.
              </p>
            </div>
          </div>

          {/* Telephony Compliance Notice */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider">
                Automated Regulatory Compliance Safeguards
              </span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Outbound calls automatically observe national calling hours, suppress registered Do Not Call (DNC) numbers, and provide unambiguous AI identity disclosure at call onset.
            </p>
          </div>
        </div>

        {/* Right Column: Live Outbound Test Dialer */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[var(--border-color)]">
            <PhoneCall className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Instant Outbound Test Dialer
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Dispatch an immediate AI call to any phone number to inspect latency, Groq reasoning, and Sarvam voice cadence live.
          </p>

          {dialResult && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <div className="font-bold flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Call Dispatched!</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                Redirecting you to Live Call Monitoring...
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleInitiateTestCall} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Recipient Phone Number (with Country Code) *
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+919876543210"
                required
                className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Format: +[CountryCode][Number], e.g. +91 9876543210 or +1 4155552671
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Select Calling Agent *
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              >
                {agents.map((ag) => (
                  <option key={ag._id} value={ag._id}>
                    {ag.name} ({ag.language.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={dialing || !testPhone.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {dialing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" />
                  <span>Initiate Test Call Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
