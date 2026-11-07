import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  PhoneOff,
  PhoneCall,
  Activity,
  Bot,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Waves
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../services/api.js';

export default function LiveCallsPage() {
  const { liveCalls, setLiveCalls } = useSocket();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();

  // Fetch initial live calls
  const fetchLiveCalls = async () => {
    try {
      const res = await api.get('/calls/live');
      if (res.data.success) {
        setLiveCalls(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch live calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCalls();
    // Live ticking timer for duration
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleHangup = async (callId) => {
    try {
      await api.post(`/calls/${callId}/hangup`);
      // Update state
      setLiveCalls((prev) =>
        prev.map((c) => (c._id === callId ? { ...c, status: 'completed' } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error hanging up call');
    }
  };

  // Mask phone number for security e.g. +91 98****3210
  const maskPhone = (phone) => {
    if (!phone || phone.length < 8) return phone || '';
    const start = phone.slice(0, 5);
    const end = phone.slice(-3);
    return `${start}****${end}`;
  };

  // Compute live duration
  const getElapsedDuration = (call) => {
    if (call.duration && call.status === 'completed') return `${call.duration}s`;
    if (!call.startTime) return '0s';
    const startMs = new Date(call.startTime).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - startMs) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Real-Time WebSocket Stream Active
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] mt-1">
            Live Call Monitoring Grid ({liveCalls.filter(c => ['initiating', 'ringing', 'connected', 'in-progress'].includes(c.status)).length} Active)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time audio stream metrics, AI conversational intent tracking, and safe carrier hang-up control
          </p>
        </div>

        <button
          onClick={() => navigate('/telephony')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 flex items-center space-x-2 cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Launch Immediate Test Call</span>
        </button>
      </div>

      {/* Grid of Live Calls */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
          Connecting to LiveKit & Telephony socket streams...
        </div>
      ) : liveCalls.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Active Calls Right Now</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-5">
            The dialer is currently standing by. When campaigns execute or outbound calls are initiated, they will stream live here.
          </p>
          <button
            onClick={() => navigate('/telephony')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            Trigger a Test Call to Yourself
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {liveCalls.map((call) => {
            const isConversation = call.status === 'in-progress' || call.status === 'connected';
            const isRinging = call.status === 'ringing';
            const isCompleted = call.status === 'completed';

            return (
              <div
                key={call._id}
                className={`p-6 rounded-3xl bg-[var(--bg-card)] border shadow-xl flex flex-col justify-between transition-all relative overflow-hidden ${
                  isConversation
                    ? 'border-emerald-500/50 shadow-emerald-500/10'
                    : isRinging
                    ? 'border-indigo-500/50 shadow-indigo-500/10'
                    : 'border-[var(--border-color)]'
                }`}
              >
                {/* Glow ring top line */}
                {isConversation && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 animate-pulse"></div>
                )}

                <div>
                  {/* Status & Live Duration */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConversation
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isRinging
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                          : isCompleted
                          ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping mr-1.5"></span>
                      {call.status === 'in-progress' ? 'In Conversation' : call.status}
                    </span>

                    <div className="flex items-center space-x-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{getElapsedDuration(call)}</span>
                    </div>
                  </div>

                  {/* Lead Information */}
                  <div className="py-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                      Lead Contact
                    </span>
                    <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                      {call.lead?.name || 'Customer'}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
                      <span>{maskPhone(call.phoneNumber)}</span>
                      {call.lead?.company && (
                        <span className="text-[var(--text-muted)] font-sans truncate">
                          &bull; {call.lead.company}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Audio Wave Animation */}
                  {isConversation && (
                    <div className="p-3 my-2 rounded-2xl bg-[var(--bg-secondary)] border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-semibold text-emerald-300">
                          AI Agent Active & Listening
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 h-5">
                        <span className="wave-bar" style={{ animationDelay: '0.1s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.3s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.5s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.2s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  )}

                  {/* Campaign & Agent reference */}
                  <div className="text-xs space-y-1 pt-1 text-[var(--text-secondary)]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Campaign:</span>
                      <span className="font-medium text-[var(--text-primary)] truncate max-w-[160px]">
                        {call.campaign?.name || 'Direct Dialer'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Assigned AI Agent:</span>
                      <span className="font-medium text-indigo-400 truncate max-w-[160px]">
                        {call.agent?.name?.split(' - ')[0] || 'Maya'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Control Footer */}
                <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/calls/${call._id}`)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>View Transcript</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {!isCompleted && (
                    <button
                      onClick={() => handleHangup(call._id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Terminate Call Safely"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>Hang Up</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
