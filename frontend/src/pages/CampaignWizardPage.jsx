import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  Megaphone,
  Users,
  Bot,
  Volume2,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../services/api.js';

export default function CampaignWizardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Campaign Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agent: '',
    script: 'Introduce our value proposition clearly, qualify their current call operations, answer objections using official knowledge, and schedule a product demo or callback.',
    language: 'en',
    voiceId: 'meera',
    timezone: 'Asia/Kolkata',
    callingHoursStart: '09:00',
    callingHoursEnd: '19:00',
    maxAttempts: 3,
    retryIntervalMinutes: 60,
    concurrencyLimit: 5
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, leadsRes] = await Promise.all([
          api.get('/agents'),
          api.get('/leads?limit=100')
        ]);

        if (agentsRes.data.success && agentsRes.data.data.length > 0) {
          setAgents(agentsRes.data.data);
          setFormData((prev) => ({ ...prev, agent: agentsRes.data.data[0]._id }));
        }

        if (leadsRes.data.success) {
          const callableLeads = leadsRes.data.data.filter((l) => !l.isDNC && l.consentStatus);
          setLeads(callableLeads);
          // By default select all callable leads
          setSelectedLeadIds(callableLeads.map((l) => l._id));
        }
      } catch (err) {
        console.error('Wizard data fetch error:', err);
      }
    };

    fetchData();
  }, []);

  const handleNext = () => {
    setError('');
    if (step === 1 && !formData.name.trim()) {
      setError('Please provide a campaign name.');
      return;
    }
    if (step === 2 && selectedLeadIds.length === 0) {
      setError('Please select at least 1 lead for this campaign.');
      return;
    }
    if (step === 3 && !formData.agent) {
      setError('Please select an AI Agent.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (launchImmediately = true) => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        leads: selectedLeadIds
      };

      const res = await api.post('/campaigns', payload);
      if (res.data.success) {
        const newCampaign = res.data.data;
        if (launchImmediately) {
          await api.post(`/campaigns/${newCampaign._id}/start`);
        }
        navigate('/campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create campaign');
      setLoading(false);
    }
  };

  const toggleLead = (id) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const stepsHeader = [
    { num: 1, title: 'Details', icon: Megaphone },
    { num: 2, title: 'Leads', icon: Users },
    { num: 3, title: 'AI Agent', icon: Bot },
    { num: 4, title: 'Voice & Schedule', icon: Volume2 },
    { num: 5, title: 'Concurrency', icon: Clock },
    { num: 6, title: 'Review & Launch', icon: ShieldCheck }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Campaign Creation Wizard
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Configure an automated AI voice calling campaign in 6 easy steps
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-x-auto">
        {stepsHeader.map((s, idx) => {
          const Icon = s.icon;
          const isDone = s.num < step;
          const isCurrent = s.num === step;

          return (
            <div key={s.num} className="flex items-center space-x-2 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isCurrent
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold ${
                  isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {s.title}
              </span>
              {idx < stepsHeader.length - 1 && (
                <div className="w-6 h-px bg-[var(--border-color)] mx-2"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Panels */}
      <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
        {/* STEP 1: CAMPAIGN DETAILS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 1: Campaign Name & Objectives
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Identify the core target audience and business goal for this outbound dialing cycle.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Q1 2026 Enterprise Outreach"
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Campaign Description / Internal Notes
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Outbound qualification targeting tech leaders to book 15-minute product demos."
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SELECT LEADS */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Step 2: Select Leads ({selectedLeadIds.length} Selected)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Select prospects to be queued for calling. All contacts shown have confirmed consent and pass DNC checks.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelectedLeadIds(
                    selectedLeadIds.length === leads.length ? [] : leads.map((l) => l._id)
                  )
                }
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                {selectedLeadIds.length === leads.length ? 'Deselect All' : 'Select All Callable'}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]">
              {leads.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No callable leads available. Please import or add leads first.
                </div>
              ) : (
                leads.map((l) => (
                  <div
                    key={l._id}
                    onClick={() => toggleLead(l._id)}
                    className="p-3 flex items-center justify-between hover:bg-[var(--bg-hover)] cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l._id)}
                        onChange={() => {}}
                        className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-semibold text-[var(--text-primary)] block">
                          {l.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {l.company || 'Individual'} &bull; {l.location || 'Location N/A'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-indigo-400">{l.phoneNumber}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 3: AI AGENT & SCRIPT */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 3: Select AI Agent & Call Script
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                AI Voice Agent
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents.map((ag) => (
                  <div
                    key={ag._id}
                    onClick={() => setFormData({ ...formData, agent: ag._id, language: ag.language, voiceId: ag.voiceId })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.agent === ag._id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      {ag.name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                      {ag.personality}
                    </span>
                    <div className="mt-2 flex items-center space-x-2 text-[10px] font-semibold text-indigo-400">
                      <span className="uppercase px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {ag.language}
                      </span>
                      <span>Voice: {ag.voiceId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Custom Campaign Script / Talking Points
              </label>
              <textarea
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 4: VOICE, LANGUAGE & SCHEDULE */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 4: Voice Synthesis & Calling Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Language Engine
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                >
                  <option value="en">English (Professional Indian / Global)</option>
                  <option value="hi">Hindi (Conversational Spoken Hindi)</option>
                  <option value="hi-en">Hinglish (Code-Mixed Indian Business)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Sarvam AI Neural Voice Model
                </label>
                <select
                  value={formData.voiceId}
                  onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                >
                  <option value="meera">Meera (Warm, Professional Female)</option>
                  <option value="pavithra">Pavithra (Polite, Consultative Female)</option>
                  <option value="arvind">Arvind (Dynamic, Clear Male)</option>
                  <option value="amol">Amol (Calm, Grounded Male)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Calling Hours Window (Start - End)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={formData.callingHoursStart}
                    onChange={(e) => setFormData({ ...formData, callingHoursStart: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                  <span className="text-xs text-[var(--text-muted)]">to</span>
                  <input
                    type="time"
                    value={formData.callingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, callingHoursEnd: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Target Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="America/New_York">America/New York (EST)</option>
                  <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CONCURRENCY & RETRIES */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 5: Concurrency & Retry Safety Limits
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Enforce safe dialer pacing and carrier rate limits to prevent call congestion.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Concurrency Limit (Simultaneous Calls)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.concurrencyLimit}
                  onChange={(e) => setFormData({ ...formData, concurrencyLimit: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Default: 5 lines</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Max Call Attempts per Lead
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Stops after max</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Retry Interval (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={1440}
                  value={formData.retryIntervalMinutes}
                  onChange={(e) => setFormData({ ...formData, retryIntervalMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">For busy / no-answer</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & LAUNCH */}
        {step === 6 && (
          <div className="space-y-5 animate-in fade-in">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 6: Review & Confirmation
            </h3>

            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Campaign Name:</span>
                <span className="font-bold text-[var(--text-primary)]">{formData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Assigned Leads:</span>
                <span className="font-bold text-indigo-400">{selectedLeadIds.length} Verified Leads</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">AI Voice Agent:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {agents.find((a) => a._id === formData.agent)?.name || 'Default Agent'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Language & Voice:</span>
                <span className="font-bold text-[var(--text-primary)] uppercase">
                  {formData.language} ({formData.voiceId})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--text-muted)]">Dialer Rules:</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {formData.concurrencyLimit} Lines &bull; {formData.maxAttempts} Attempts &bull; {formData.callingHoursStart}-{formData.callingHoursEnd}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center space-x-3 text-xs text-emerald-400">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>
                Compliance certified: Do-Not-Call (DNC) numbers are automatically suppressed, and outbound calling will strictly adhere to the configured calling hours.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 pt-5 border-t border-[var(--border-color)] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-3">
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-slate-500 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Launch Campaign Immediately</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
