import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Megaphone,
  Radio,
  History,
  BarChart3,
  Bot,
  BookOpen,
  PhoneCall,
  Cpu,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PhoneForwarded,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Add Leads', path: '/add-leads', icon: UserPlus },
  { name: 'All Leads', path: '/leads', icon: Users },
  { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { name: 'Live Calls', path: '/live-calls', icon: Radio, badge: 'Live' },
  { name: 'Call History', path: '/call-history', icon: History },
  { name: 'Call Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'AI Agent Settings', path: '/ai-agents', icon: Bot },
  { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
  { name: 'Phone & Telephony', path: '/telephony', icon: PhoneCall },
  { name: 'Integrations', path: '/integrations', icon: Cpu },
  { name: 'Admin Settings', path: '/settings', icon: Settings }
];

export default function DashboardLayout() {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, clearNotification } = useSocket();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentRouteName =
    navItems.find((item) =>
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    )?.name || 'Dashboard';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-base tracking-wide bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  NexusVoice AI
                </span>
                <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-medium">
                  Outbound Voice SaaS
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-indigo-400' : 'text-[var(--text-muted)] group-hover:text-indigo-400'
                  }`}
                />
                {!collapsed && <span className="ml-3 truncate">{item.name}</span>}

                {/* Badge (e.g. LIVE) */}
                {!collapsed && item.badge && (
                  <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-slate-100 text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <img
                src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                alt={admin?.name || 'Admin'}
                className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30 flex-shrink-0"
              />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate text-[var(--text-primary)]">
                    {admin?.name || 'Admin User'}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">
                    {admin?.role || 'Admin'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between px-6 z-20">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {currentRouteName}
            </h1>
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
              Groq & Telephony Online
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Live Call Action */}
            <button
              onClick={() => navigate('/telephony')}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
              <span>Test Call Dialer</span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-secondary)]"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Live Event Stream ({notifications.length})
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-color)] mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="py-2.5 flex items-start justify-between group">
                          <div className="pr-2">
                            <p className="text-xs font-semibold text-[var(--text-primary)]">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                          <button
                            onClick={() => clearNotification(notif.id)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--bg-primary)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
