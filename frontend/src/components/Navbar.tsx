import React from 'react';
import { Shield, Database, UserCheck, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface Props {
  latestStatus?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<Props> = ({ latestStatus = 'VALID', onRefresh, isRefreshing }) => {
  const { user, logout, switchRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-cyan-950">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">SecureMarks</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
              LEDGER v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium -mt-0.5">
            Academic Integrity Through Cryptographic Verification
          </p>
        </div>
      </div>

      {/* Center Database Status Indicator */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>PostgreSQL 16 &bull; pgcrypto SHA-256</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh database ledger and verification status"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}
      </div>

      {/* User Session & Role Switcher */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              {(['admin', 'faculty', 'student'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-all ${
                    user.role === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-cyan-400 font-mono capitalize">{user.role}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Guest Visitor</span>
          </div>
        )}
      </div>
    </header>
  );
};
