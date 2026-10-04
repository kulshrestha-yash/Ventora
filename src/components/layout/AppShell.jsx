// src/components/layout/AppShell.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import {
  LayoutDashboard,
  Lightbulb,
  PlusCircle,
  Inbox,
  MessageSquare,
  Settings,
  LogOut,
  Compass,
  Heart,
  Send,
  Coins,
  Sliders,
  Menu,
  X,
  Bell,
  ChevronRight
} from "lucide-react";
import { Avatar, TokenChip } from "../ui/index.js";

export function AppShell({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const { tokenBalance, unreadMessagesCount, pendingRequestsCount } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isInnovator = user?.role === "innovator";

  const innovatorLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/ideas/new", label: "+ Submit New Idea", icon: PlusCircle, isHighlight: true },
    { to: "/requests", label: "Requests", icon: Inbox, count: pendingRequestsCount },
    { to: "/messages", label: "Messages", icon: MessageSquare, count: unreadMessagesCount },
    { to: "/profile", label: "Profile & Settings", icon: Settings }
  ];

  const investorLinks = [
    { to: "/feed", label: "My Feed", icon: Compass },
    { to: "/saved", label: "Saved Ideas", icon: Heart },
    { to: "/my-requests", label: "My Requests", icon: Send },
    { to: "/messages", label: "Messages", icon: MessageSquare, count: unreadMessagesCount },
    { to: "/tokens", label: "Tokens", icon: Coins, chip: tokenBalance },
    { to: "/onboarding/investor?edit=1", label: "Preferences", icon: Sliders },
    { to: "/profile", label: "Profile & Settings", icon: Settings }
  ];

  const navLinks = isInnovator ? innovatorLinks : investorLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-ink text-surface p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 pt-2 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-extrabold tracking-[0.2em] border-2 border-white px-2.5 py-0.5 text-xs rounded text-white bg-transparent">
            VENTORA
          </span>
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
          {isInnovator ? "Innovator" : "Investor"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to.split("?")[0];
          const Icon = link.icon;

          if (link.isHighlight) {
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit New Idea</span>
              </Link>
            );
          }

          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-semibold"
                  : "text-ink-faint hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-ink-faint"}`} />
                <span>{link.label}</span>
              </div>
              {link.count !== undefined && link.count > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-white font-mono">
                  {link.count}
                </span>
              )}
              {link.chip !== undefined && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {link.chip}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile row bottom */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
        <Link
          to="/profile"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
        >
          <Avatar
            name={user?.name}
            code={user?.code}
            hue={user?.avatarHue}
            size="sm"
            verified={user?.kyc?.status === "verified"}
          />
          <div className="min-w-0 text-left">
            <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-ink-faint font-mono">
              {user?.code || (isInnovator ? "Innovator" : "Investor")}
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-ink-faint hover:text-danger p-1.5 rounded transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-subtle flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 fixed inset-y-0 left-0 z-30 shadow-card">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-pop z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-line px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-ink-muted hover:text-ink rounded-md"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-ink leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-ink-muted hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {actions && <div className="flex items-center gap-2">{actions}</div>}

            {/* Investor Token Chip */}
            {!isInnovator && (
              <Link to="/tokens">
                <TokenChip balance={tokenBalance} />
              </Link>
            )}

            {/* Notification Bell */}
            <Link
              to={isInnovator ? "/requests" : "/messages"}
              className="relative p-2 text-ink-muted hover:text-ink rounded-full hover:bg-surface-subtle transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {(pendingRequestsCount > 0 || unreadMessagesCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </Link>

            {/* Profile Avatar */}
            <Link to="/profile" className="shrink-0">
              <Avatar
                name={user?.name}
                code={user?.code}
                hue={user?.avatarHue}
                size="sm"
                verified={user?.kyc?.status === "verified"}
              />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
