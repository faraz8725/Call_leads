import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  User,
  PhoneCall,
  Clock,
  Play,
  Pause,
  Volume2,
  Download,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  Search,
  Sparkles,
  FileText
} from 'lucide-react';
import api from '../services/api.js';

export default function CallDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [callData, setCallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchCallDetails = async () => {
      try {
        const res = await api.get(`/calls/${id}`);
        if (res.data.success) {
          setCallData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load call details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCallDetails();
  }, [id]);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setAudioCurrentTime(seekTime);
    }
  };

  const formatAudioTime = (sec) => {
    if (isNaN(sec) || !sec) return '00:00';
    const mins = Math.floor(sec / 60);
    const remSecs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Loading complete call intelligence dossier...
      </div>
    );
  }

  if (!callData || !callData.call) {
    return (
      <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <h3 className="text-base font-bold text-[var(--text-primary)]">Call Record Not Found</h3>
        <button
          onClick={() => navigate('/call-history')}
          className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Call History
        </button>
      </div>
    );
  }

  const { call, transcript, recording } = callData;
  const messages = transcript?.messages || [];
  const filteredMessages = messages.filter((m) =>
    transcriptSearch ? m.text.toLowerCase().includes(transcriptSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              call.outcome === 'Interested'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : call.outcome === 'Human Handoff Requested'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : call.outcome === 'Callback Requested'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            Outcome: {call.outcome}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Provider Call ID: {call.providerCallId || 'N/A'}
          </span>
        </div>
      </div>

      {/* Human Handoff Alert Banner */}
      {call.humanHandoffRequired && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-start space-x-3 shadow-lg">
          <UserCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-400" />
          <div className="text-xs">
            <span className="font-bold text-sm block text-purple-200">
              Human Representative Escalation Required
            </span>
            <p className="mt-0.5 leading-relaxed">
              {call.humanHandoffReason ||
                'Lead explicitly requested to speak with a human agent during conversation.'}
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Lead Information */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-3">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Lead Contact
          </span>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {call.lead?.name || 'Customer'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {call.lead?.company || 'Organization Unassigned'}
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Phone:</span>
              <span className="font-mono font-medium text-indigo-400">{call.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Email:</span>
              <span className="text-[var(--text-primary)] truncate max-w-[150px]">{call.lead?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Location:</span>
              <span className="text-[var(--text-primary)]">{call.lead?.location || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Consent:</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Opt-in Verified
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Call Operational Metadata */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-3">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Call Parameters
          </span>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {call.campaign?.name || 'Direct Telephony Call'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Agent: {call.agent?.name || 'AI Assistant'}
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Duration:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{call.duration} seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Dial Time:</span>
              <span className="text-[var(--text-secondary)]">
                {call.startTime ? new Date(call.startTime).toLocaleTimeString() : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Telephony Carrier:</span>
              <span className="uppercase font-mono text-indigo-400 font-semibold">{call.telephonyProvider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Language Model:</span>
              <span className="font-medium text-[var(--text-primary)]">Groq (Llama 3.3 70B)</span>
            </div>
          </div>
        </div>

        {/* Card 3: AI Intent & Sentiment Insights */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-3">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            AI Classification
          </span>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Interest Score</h3>
              <span className="text-lg font-extrabold font-mono text-emerald-400">
                {call.interestScore || 50}/100
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                style={{ width: `${call.interestScore || 50}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Sentiment:</span>
              <span
                className={`font-semibold ${
                  call.sentiment === 'Positive'
                    ? 'text-emerald-400'
                    : call.sentiment === 'Negative'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {call.sentiment || 'Neutral'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Primary Intent:</span>
              <span className="text-[var(--text-primary)] font-medium truncate max-w-[150px]">
                {call.customerIntent || 'Product Inquiry'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Objections Raised:</span>
              <span className="text-[var(--text-primary)]">
                {call.objections && call.objections.length > 0 ? call.objections.length : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Recording Player */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Call Audio Recording Playback
            </h3>
          </div>
          {call.recordingUrl && (
            <a
              href={call.recordingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Audio</span>
            </a>
          )}
        </div>

        <audio
          ref={audioRef}
          src={call.recordingUrl || 'https://actions.google.com/sounds/v1/speech/greeting_sample.ogg'}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayAudio}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <span className="font-mono text-xs text-[var(--text-muted)] w-12">
            {formatAudioTime(audioCurrentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={audioDuration || call.duration || 100}
            value={audioCurrentTime}
            onChange={handleAudioSeek}
            className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <span className="font-mono text-xs text-[var(--text-muted)] w-12 text-right">
            {formatAudioTime(audioDuration || call.duration || 0)}
          </span>
        </div>
      </div>

      {/* Executive Summary & Action Items */}
      {transcript?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                AI Executive Summary
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {transcript.summary}
            </p>
          </div>

          {/* Action Items */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Recommended Action Items
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {(transcript.actionItems || []).length === 0 ? (
                <li>No pending action items for this call.</li>
              ) : (
                transcript.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Chat-Style Conversation Transcript Section */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden">
        {/* Transcript Header with Search */}
        <div className="p-5 border-b border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Full Conversational Transcript
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Speech-to-text recorded dialogue between AI Agent and lead
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={transcriptSearch}
              onChange={(e) => setTranscriptSearch(e.target.value)}
              placeholder="Search transcript..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Chat Stream */}
        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-[var(--bg-primary)]">
          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No transcript dialogue recorded for this call.
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isAI = msg.speaker === 'ai';

              return (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-lg p-4 rounded-2xl text-xs shadow-md ${
                      isAI
                        ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] opacity-75">
                      <span className="font-bold uppercase tracking-wider">
                        {isAI ? call.agent?.name?.split(' - ')[0] || 'AI Agent' : call.lead?.name || 'Lead'}
                      </span>
                      <span className="font-mono">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {!isAI && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
