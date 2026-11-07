import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

// Pages
import LoginPage from '../pages/LoginPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import AddLeadsPage from '../pages/AddLeadsPage.jsx';
import AllLeadsPage from '../pages/AllLeadsPage.jsx';
import CampaignsPage from '../pages/CampaignsPage.jsx';
import CampaignWizardPage from '../pages/CampaignWizardPage.jsx';
import LiveCallsPage from '../pages/LiveCallsPage.jsx';
import CallHistoryPage from '../pages/CallHistoryPage.jsx';
import CallDetailsPage from '../pages/CallDetailsPage.jsx';
import CallAnalyticsPage from '../pages/CallAnalyticsPage.jsx';
import AIAgentSettingsPage from '../pages/AIAgentSettingsPage.jsx';
import KnowledgeBasePage from '../pages/KnowledgeBasePage.jsx';
import PhoneTelephonySettingsPage from '../pages/PhoneTelephonySettingsPage.jsx';
import IntegrationsPage from '../pages/IntegrationsPage.jsx';
import AdminSettingsPage from '../pages/AdminSettingsPage.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          !loading && isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      {/* Protected Dashboard Layout and Subpages */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="add-leads" element={<AddLeadsPage />} />
        <Route path="leads" element={<AllLeadsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/new" element={<CampaignWizardPage />} />
        <Route path="live-calls" element={<LiveCallsPage />} />
        <Route path="call-history" element={<CallHistoryPage />} />
        <Route path="calls/:id" element={<CallDetailsPage />} />
        <Route path="analytics" element={<CallAnalyticsPage />} />
        <Route path="ai-agents" element={<AIAgentSettingsPage />} />
        <Route path="knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="telephony" element={<PhoneTelephonySettingsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
