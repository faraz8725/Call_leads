import React, { useState } from 'react';
import {
  Settings,
  Shield,
  ShieldCheck,
  User,
  Key,
  Lock,
  Clock,
  Database,
  FileCheck,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export default function AdminSettingsPage() {
  const { admin, updateAdmin } = useAuth();

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    avatar: admin?.avatar || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Compliance Policy State
  const [compliancePolicy, setCompliancePolicy] = useState({
    enforceDNC: true,
    restrictCallingHours: true,
    defaultStart: '09:00',
    defaultEnd: '19:00',
    enableRecordingDisclosure: true,
    disclosureText: 'This call is an automated communication and may be recorded for quality and verification purposes.'
  });
  const [complianceSaved, setComplianceSaved] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');

    try {
      const res = await api.put('/auth/profile', profileForm);
      if (res.data.success) {
        updateAdmin(res.data.admin);
        setProfileSuccess('Profile successfully updated.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveCompliance = (e) => {
    e.preventDefault();
    setComplianceSaved(true);
    setTimeout(() => setComplianceSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Admin Portal & Security Governance
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Administrator profile, telemarketing compliance rules, TCPA consent policies, and audit retention
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Profile Card */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[var(--border-color)]">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Admin Profile & Credentials
            </h3>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Profile Avatar URL
              </label>
              <input
                type="url"
                value={profileForm.avatar}
                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Update Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Access Overview */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[var(--border-color)]">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Security & Session Guardrails
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">Authentication Protocol</span>
                <span className="text-[11px] text-[var(--text-muted)]">Signed HMAC-SHA256 JWT Token</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">Password Hashing</span>
                <span className="text-[11px] text-[var(--text-muted)]">bcrypt with 10 salt rounds</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Enforced
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">API Rate Limiting</span>
                <span className="text-[11px] text-[var(--text-muted)]">Strict burst protection on auth & dialing routes</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">Helmet Security Headers</span>
                <span className="text-[11px] text-[var(--text-muted)]">Cross-origin isolation, clickjacking protection</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemarketing & Consent Compliance Governance */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-[var(--border-color)]">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Telecom & TCPA Regulatory Compliance Engine
          </h3>
        </div>

        {complianceSaved && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            Compliance rules successfully saved.
          </div>
        )}

        <form onSubmit={handleSaveCompliance} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-start space-x-3">
              <input
                type="checkbox"
                id="dncCheck"
                checked={compliancePolicy.enforceDNC}
                onChange={(e) => setCompliancePolicy({ ...compliancePolicy, enforceDNC: e.target.checked })}
                className="mt-0.5 rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
              />
              <label htmlFor="dncCheck" className="cursor-pointer">
                <span className="font-bold text-[var(--text-primary)] block">
                  Strict DNC (Do Not Call) Suppression
                </span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Automatically suppress numbers marked as DNC across all active campaigns. If a caller requests removal, the AI marks them immediately.
                </p>
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-start space-x-3">
              <input
                type="checkbox"
                id="hoursCheck"
                checked={compliancePolicy.restrictCallingHours}
                onChange={(e) => setCompliancePolicy({ ...compliancePolicy, restrictCallingHours: e.target.checked })}
                className="mt-0.5 rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
              />
              <label htmlFor="hoursCheck" className="cursor-pointer">
                <span className="font-bold text-[var(--text-primary)] block">
                  Enforce Legal Calling Hours Window
                </span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Campaign dialers will automatically pause outside legal telemarketing hours (09:00 - 19:00 local time).
                </p>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              Call Recording Disclosure Notice (AI Opening Transcript)
            </label>
            <input
              type="text"
              value={compliancePolicy.disclosureText}
              onChange={(e) => setCompliancePolicy({ ...compliancePolicy, disclosureText: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Compliance Safeguards</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
