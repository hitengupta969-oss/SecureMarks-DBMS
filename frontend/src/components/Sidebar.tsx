import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileEdit,
  Link2,
  ShieldCheck,
  Users,
  Cpu,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export type NavTab = 
  | 'dashboard'
  | 'register'
  | 'entry'
  | 'ledger'
  | 'verify'
  | 'students'
  | 'hardware'
  | 'research';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasTampering?: boolean;
}

export const Sidebar: React.FC<Props> = ({ currentTab, onSelectTab, hasTampering }) => {
  const { isStudent } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'register' as NavTab, label: 'Marks Register', icon: FileSpreadsheet },
    { id: 'entry' as NavTab, label: 'Enter / Correct Marks', icon: FileEdit, hideForStudent: true },
    { id: 'ledger' as NavTab, label: 'Ledger Explorer', icon: Link2 },
    { 
      id: 'verify' as NavTab, 
      label: 'Integrity Verification', 
      icon: hasTampering ? AlertTriangle : ShieldCheck,
      badge: hasTampering ? 'ALERT' : 'LIVE',
      badgeColor: hasTampering ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-950 text-emerald-400'
    },
    { id: 'students' as NavTab, label: 'Student Directory', icon: Users, hideForStudent: true },
    { id: 'hardware' as NavTab, label: 'Hardware Terminal (IoT)', icon: Cpu },
    { id: 'research' as NavTab, label: 'Research Article & Specs', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Ledger Navigation
        </div>
        {navItems.map((item) => {
          if (item.hideForStudent && isStudent) return null;

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/30 shadow-sm shadow-blue-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database Technology Footprint */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
          Architecture Specs
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          PostgreSQL 16 &bull; pgcrypto &bull; SQL Trigger Append &bull; SHA-256 Ledger &bull; Python Hashlib Verifier
        </p>
      </div>
    </aside>
  );
};
