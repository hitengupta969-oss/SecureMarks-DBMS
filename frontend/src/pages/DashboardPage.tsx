import React, { useEffect, useState } from 'react';
import {
  Users, BookOpen, GraduationCap, Link2,
  ShieldCheck, AlertTriangle, ArrowUpRight, TrendingUp, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { api } from '../services/api';
import { DashboardStats, VerificationReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { HashBadge } from '../components/HashBadge';
import { AlertBanner } from '../components/AlertBanner';

interface Props {
  onNavigateTab: (tab: any) => void;
  report: VerificationReport | null;
}

export const DashboardPage: React.FC<Props> = ({ onNavigateTab, report }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [report]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isTampered = report?.status === 'TAMPERING_DETECTED' || (stats?.detected_violations ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Alert Banner if Tampered or Verified */}
      <AlertBanner report={report} onNavigateToVerify={() => onNavigateTab('verify')} />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Students</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {stats?.total_students ?? '--'}
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">CSE & IT Departments</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/30 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Subjects & Exams */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Curriculum & Exams</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {stats?.total_subjects ?? '--'} / {stats?.total_exams ?? '--'}
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">Subjects / Active Exams</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/30 text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Ledger Blocks */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Ledger Sequence Blocks</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {stats?.total_ledger_records ?? '--'}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Chained via SHA-256</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/30 text-emerald-400">
            <Link2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Integrity Status */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between ${
          isTampered
            ? 'bg-rose-950/50 border-rose-600/60 shadow-lg shadow-rose-950/40 animate-pulse'
            : 'bg-slate-900/80 border-slate-800/80'
        }`}>
          <div>
            <span className="text-xs font-semibold text-slate-400">Ledger Integrity</span>
            <div className="mt-1.5">
              <StatusBadge status={report?.status || stats?.latest_verification_status || 'VALID'} size="sm" />
            </div>
            <span className={`text-[11px] font-medium block mt-1 ${isTampered ? 'text-rose-400' : 'text-slate-400'}`}>
              {isTampered ? `${report?.invalid_records || stats?.detected_violations} Alteration(s)` : '0 Violations Detected'}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isTampered ? 'bg-rose-900/60 border-rose-500/50 text-rose-300' : 'bg-emerald-950/60 border-emerald-800/30 text-emerald-400'
          }`}>
            {isTampered ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Main Grid: Grade Distribution Chart & Recent Ledger Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Grade Range Analytics */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Academic Marks Distribution (Grade Brackets)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated from all verified records in PostgreSQL marks_ledger
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Database View
            </span>
          </div>

          <div className="h-64 w-full">
            {stats?.marks_distribution && stats.marks_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.marks_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="grade_range" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.marks_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#38bdf8', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading database statistics...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Demonstration Actions */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Evaluation Lab Controls
            </div>
            <h3 className="text-base font-bold text-white mb-2">Controlled Tamper Experiment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify how direct database modifications (e.g., an unauthorized SQL UPDATE) fail cryptographic verification because the stored hash payload remains unchanged.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => onNavigateTab('verify')}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-md shadow-blue-950"
            >
              <span>Run Verification Engine</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('ledger')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-between border border-slate-700 transition-colors"
            >
              <span>Inspect Hash-Chained Blocks</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('hardware')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-between border border-slate-700 transition-colors"
            >
              <span>Open ESP32 Hardware Console</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Ledger Append Events */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Latest Cryptographic Ledger Appends</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live chronological chain blocks sealed by SQL triggers
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('ledger')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Full Ledger Explorer &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
              <tr>
                <th className="py-2.5 px-3">Seq</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Marks</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Current Hash (SHA-256)</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.recent_ledger_entries && stats.recent_ledger_entries.length > 0 ? (
                stats.recent_ledger_entries.map((rec) => (
                  <tr key={rec.sequence_no} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">#{rec.sequence_no}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-200">{rec.student_roll_snapshot}</span>
                      <span className="text-[11px] text-slate-400 block">{rec.student_name_snapshot}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{rec.subject_code_snapshot}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{Number(rec.marks).toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        rec.event_type === 'MARK_CORRECTED'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          : 'bg-blue-950 text-blue-300 border border-blue-800/40'
                      }`}>
                        {rec.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <HashBadge hash={rec.current_hash} truncateLength={6} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(rec.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No ledger records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
