import React, { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  Volume2,
  Sparkles,
  Save,
  Trash2,
  Play,
  Send,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Mic
} from 'lucide-react';
import api from '../services/api.js';

export default function AIAgentSettingsPage() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Interactive Testing Playground state
  const [testMessage, setTestMessage] = useState('');
  const [testChatHistory, setTestChatHistory] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      if (res.data.success) {
        setAgents(res.data.data);
        if (res.data.data.length > 0 && !selectedAgent) {
          setSelectedAgent(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load AI agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateNew = () => {
    const newAgentTemplate = {
      name: 'New Custom Calling Agent',
      description: 'AI agent tailored for specific outbound campaigns.',
      personality: 'Helpful, consultative, and professional.',
      language: 'en',
      voiceProvider: 'sarvam',
      voiceId: 'meera',
      speakingStyle: 'Professional',
      speakingRate: 1.0,
      systemPrompt: `You are an AI Voice Calling Assistant. Introduce yourself clearly as an AI assistant. Identify the call purpose. Understand English, Hindi, and Hinglish. Answer strictly based on knowledge base. Never make false promises.`,
      greetingMessage: 'Hello! This is Maya, an AI assistant calling from our team. Am I speaking with {{lead_name}}?',
      callObjectives: ['Introduce value proposition', 'Answer questions', 'Qualify interest'],
      maxCallDuration: 300,
      humanHandoffKeywords: ['human', 'manager', 'supervisor', 'agent', 'real person'],
      optOutKeywords: ['stop', 'not interested', 'dnc', 'remove me']
    };
    setSelectedAgent(newAgentTemplate);
    setTestChatHistory([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);

    try {
      if (selectedAgent._id) {
        const res = await api.put(`/agents/${selectedAgent._id}`, selectedAgent);
        if (res.data.success) {
          setSaveSuccess(true);
          fetchAgents();
        }
      } else {
        const res = await api.post('/agents', selectedAgent);
        if (res.data.success) {
          setSaveSuccess(true);
          setSelectedAgent(res.data.data);
          fetchAgents();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save agent');
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent?._id) return;
    if (!window.confirm(`Delete AI Agent "${selectedAgent.name}"?`)) return;

    try {
      await api.delete(`/agents/${selectedAgent._id}`);
      setSelectedAgent(null);
      fetchAgents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete agent');
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testMessage.trim() || !selectedAgent?._id) return;

    const userMsg = testMessage.trim();
    setTestMessage('');
    const newHistory = [...testChatHistory, { speaker: 'lead', text: userMsg }];
    setTestChatHistory(newHistory);
    setIsTesting(true);

    try {
      const res = await api.post('/agents/test-chat', {
        agentId: selectedAgent._id,
        userMessage: userMsg,
        history: testChatHistory
      });

      if (res.data.success) {
        const { replyText, audioBase64 } = res.data.data;
        setTestChatHistory([
          ...newHistory,
          { speaker: 'ai', text: replyText, audioBase64 }
        ]);

        // If audio returned, play speech preview
        if (audioBase64) {
          const snd = new Audio(`data:audio/wav;base64,${audioBase64}`);
          snd.play().catch(() => {});
        }
      }
    } catch (err) {
      setTestChatHistory([
        ...newHistory,
        { speaker: 'ai', text: 'Error executing test turn with Groq adapter.' }
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading AI agents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            AI Voice Agent Engineering
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Tune Groq LLM system prompts, conversational guardrails, and Sarvam AI Indian neural voices
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New AI Agent</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Agents List */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
            Configured Voice Agents ({agents.length})
          </span>

          <div className="space-y-2">
            {agents.map((ag) => (
              <div
                key={ag._id}
                onClick={() => {
                  setSelectedAgent(ag);
                  setTestChatHistory([]);
                  setSaveSuccess(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAgent?._id === ag._id
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400 font-semibold'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold truncate">{ag.name}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                    {ag.language}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                  {ag.description || ag.personality}
                </p>
                <div className="mt-2 text-[10px] text-[var(--text-muted)] flex items-center space-x-3">
                  <span>Voice: {ag.voiceId}</span>
                  <span>Style: {ag.speakingStyle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Agent Configuration & Simulator Tabs */}
        {selectedAgent && (
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Editor Form */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-5">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {selectedAgent._id ? 'Edit Agent Settings' : 'New Agent Configuration'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Configure prompt instructions and Sarvam voice parameters
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedAgent._id && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Agent</span>
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>AI Agent configuration successfully updated in MongoDB.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Agent Name *
                    </label>
                    <input
                      type="text"
                      value={selectedAgent.name}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Speaking Style
                    </label>
                    <select
                      value={selectedAgent.speakingStyle}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, speakingStyle: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Consultative">Consultative</option>
                      <option value="Assertive">Assertive</option>
                      <option value="Conversational">Conversational</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Language Engine
                    </label>
                    <select
                      value={selectedAgent.language}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, language: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                    >
                      <option value="en">English (Professional Indian / Global)</option>
                      <option value="hi">Hindi (Spoken Hindi)</option>
                      <option value="hi-en">Hinglish (Code-Mixed Indian Business)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Sarvam AI Neural Voice Model
                    </label>
                    <select
                      value={selectedAgent.voiceId}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, voiceId: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                    >
                      <option value="meera">Meera (Warm, Professional Female)</option>
                      <option value="pavithra">Pavithra (Polite, Consultative Female)</option>
                      <option value="arvind">Arvind (Dynamic, Clear Male)</option>
                      <option value="amol">Amol (Calm, Grounded Male)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Greeting Message (Opening Turn)
                  </label>
                  <input
                    type="text"
                    value={selectedAgent.greetingMessage}
                    onChange={(e) => setSelectedAgent({ ...selectedAgent, greetingMessage: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono text-xs"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                    Supported variables: &#123;&#123;lead_name&#125;&#125;, &#123;&#123;company&#125;&#125;, &#123;&#123;agent_name&#125;&#125;
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    System Prompt (Groq Llama 3.3 Persona & Instructions)
                  </label>
                  <textarea
                    value={selectedAgent.systemPrompt}
                    onChange={(e) => setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value })}
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Human Handoff Trigger Keywords (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={
                        Array.isArray(selectedAgent.humanHandoffKeywords)
                          ? selectedAgent.humanHandoffKeywords.join(', ')
                          : selectedAgent.humanHandoffKeywords || ''
                      }
                      onChange={(e) =>
                        setSelectedAgent({
                          ...selectedAgent,
                          humanHandoffKeywords: e.target.value.split(',').map((k) => k.trim())
                        })
                      }
                      className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      DNC Opt-Out Keywords (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={
                        Array.isArray(selectedAgent.optOutKeywords)
                          ? selectedAgent.optOutKeywords.join(', ')
                          : selectedAgent.optOutKeywords || ''
                      }
                      onChange={(e) =>
                        setSelectedAgent({
                          ...selectedAgent,
                          optOutKeywords: e.target.value.split(',').map((k) => k.trim())
                        })
                      }
                      className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Interactive Test Sandbox Simulator */}
            {selectedAgent._id && (
              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Interactive Voice & Dialogue Sandbox
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Test Mode
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] mb-4">
                  {testChatHistory.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                      Type a mock prospect response below (e.g. "Tell me more about pricing" or "Haan, bataiye") to test how this agent responds and synthesizes audio.
                    </div>
                  ) : (
                    testChatHistory.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start space-x-2 ${
                          m.speaker === 'ai' ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        {m.speaker === 'ai' && (
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-sm ${
                            m.speaker === 'ai'
                              ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isTesting && (
                    <div className="text-xs text-indigo-400 italic flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Agent reasoning with Groq...</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendTestMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type caller response to simulate turn..."
                    className="flex-1 px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isTesting || !testMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
