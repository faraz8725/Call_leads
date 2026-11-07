import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  ExternalLink,
  Bot,
  Mic,
  Volume2,
  Radio,
  PhoneCall,
  X
} from 'lucide-react';
import api from '../services/api.js';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Key Update Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [credentialsForm, setCredentialsForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/integrations');
      if (res.data.success) {
        setIntegrations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async (provider) => {
    setTestingProvider(provider);
    try {
      const res = await api.post(`/integrations/test/${provider}`);
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: res.data.success,
          message: res.data.message
        }
      }));
      fetchIntegrations();
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: err.response?.data?.message || err.message || 'Connection test failed'
        }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const openKeyModal = (item) => {
    setSelectedProvider(item);
    setCredentialsForm({});
    setShowModal(true);
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setSaving(true);
    try {
      await api.post('/integrations/update', {
        provider: selectedProvider.provider,
        credentials: credentialsForm
      });
      setShowModal(false);
      fetchIntegrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating credentials');
    } finally {
      setSaving(false);
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'groq':
        return <Bot className="w-5 h-5 text-indigo-400" />;
      case 'deepgram':
        return <Mic className="w-5 h-5 text-cyan-400" />;
      case 'sarvam':
        return <Volume2 className="w-5 h-5 text-emerald-400" />;
      case 'livekit':
        return <Radio className="w-5 h-5 text-purple-400" />;
      case 'vobiz':
        return <PhoneCall className="w-5 h-5 text-amber-400" />;
      default:
        return <Cpu className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
          AI & Telephony Infrastructure Hub
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Manage service adapters, API keys, and end-to-end connectivity status for Groq, Deepgram, Sarvam, LiveKit, and Vobiz
        </p>
      </div>

      {/* Info notice about Fallback/Simulation capability */}
      <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex items-start space-x-3 text-xs text-[var(--text-secondary)] leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[var(--text-primary)] block">
            Adapter Pattern & Modular Integration Architecture
          </span>
          All 5 service adapters operate with strict boundary separation. When live credentials are provided in your environment or via the dialogs below, the platform connects directly to provider production endpoints. In development or trial mode without credentials, robust fallback simulation pipelines ensure full interactive testing.
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => {
          const test = testResults[item.provider];

          return (
            <div
              key={item.provider}
              className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
                      {getProviderIcon(item.provider)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text-primary)]">
                        {item.displayName}
                      </h3>
                      <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isConfigured
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.isConfigured ? 'Active Key' : 'Simulation Mode'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-secondary)] my-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Connectivity Test feedback */}
                {test && (
                  <div
                    className={`p-3 rounded-2xl text-xs mb-3 border ${
                      test.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1">
                      {test.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{test.success ? 'Connectivity Verified' : 'Check Failed'}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-tight">{test.message}</p>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                <button
                  onClick={() => openKeyModal(item)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] flex items-center space-x-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Configure</span>
                </button>

                <button
                  onClick={() => handleTestConnection(item.provider)}
                  disabled={testingProvider === item.provider}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${testingProvider === item.provider ? 'animate-spin' : ''}`}
                  />
                  <span>{testingProvider === item.provider ? 'Testing...' : 'Test Ping'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Credentials Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Configure {selectedProvider.displayName}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Save production API credentials securely
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  API Key / Secret Token *
                </label>
                <input
                  type="password"
                  placeholder="Enter secret API key..."
                  value={credentialsForm.apiKey || ''}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, apiKey: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono"
                />
              </div>

              {selectedProvider.provider === 'livekit' && (
                <>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      LiveKit Host URL (e.g. wss://project.livekit.cloud)
                    </label>
                    <input
                      type="text"
                      placeholder="wss://your-subdomain.livekit.cloud"
                      value={credentialsForm.host || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, host: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      LiveKit API Secret
                    </label>
                    <input
                      type="password"
                      placeholder="API Secret..."
                      value={credentialsForm.apiSecret || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, apiSecret: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </>
              )}

              {selectedProvider.provider === 'vobiz' && (
                <>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Vobiz Account Secret
                    </label>
                    <input
                      type="password"
                      placeholder="Vobiz API Secret..."
                      value={credentialsForm.apiSecret || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, apiSecret: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Outbound Caller ID (Phone Number)
                    </label>
                    <input
                      type="tel"
                      placeholder="+18005550199"
                      value={credentialsForm.phoneNumber || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, phoneNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </>
              )}

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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Verify Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
