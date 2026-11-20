import React, { useState } from 'react';
import {
  ShieldCheck, AlertOctagon, RefreshCw, Zap,
  CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Bug, FileCode
} from 'lucide-react';
import { api } from '../services/api';
import { VerificationReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { HashBadge } from '../components/HashBadge';
import { useAuth } from '../hooks/useAuth';

interface Props {
  report: VerificationReport | null;
  onRefreshReport: () => Promise<void>;
}

export const VerificationPage: React.FC<Props> = ({ report, onRefreshReport }) => {
  const { isAdmin } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperSeq, setTamperSeq] = useState<number>(1);
  const [tamperMarks, setTamperMarks] = useState<number>(99.50);
  const [isTampering, setIsTampering] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleRunVerification = async () => {
    setIsVerifying(true);
    setActionMessage(null);
    try {
      await onRefreshReport();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    setActionMessage(null);
    try {
      const res = await api.simulateTamper(Number(tamperSeq), Number(tamperMarks));
      setActionMessage(`Unauthorized modification executed on Sequence #${res.target_sequence}: Marks updated to ${res.tampered_marks}. Independent verification immediately triggered.`);
      await onRefreshReport();
    } catch (err: any) {
      alert(`Tamper simulation failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setActionMessage(null);
    try {
      const res = await api.restoreTampered(Number(tamperSeq));
      setActionMessage('Database marks restored to match canonical payload. Ledger integrity is restored.');
      await onRefreshReport();
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const isTampered = report?.status === 'TAMPERING_DETECTED' || report?.status === 'CHAIN_BROKEN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Independent Cryptographic Verification Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Recalculates SHA-256 hashes using Python hashlib and compares with stored PostgreSQL pgcrypto seals
          </p>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={isVerifying}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          {isVerifying ? 'Verifying Ledger Chain...' : 'Verify Ledger Integrity Now'}
        </button>
      </div>

      {/* Main Integrity Status Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isTampered
          ? 'bg-rose-950/80 border-rose-600 shadow-2xl shadow-rose-950/70 ring-1 ring-rose-500'
          : 'bg-slate-900/90 border-slate-800 shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              isTampered
                ? 'bg-rose-900/60 border-rose-500/50 text-rose-300'
                : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
            }`}>
              {isTampered ? <AlertOctagon className="w-8 h-8 animate-pulse" /> : <ShieldCheck className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">
                  {isTampered ? 'TAMPERING DETECTED' : 'LEDGER INTEGRITY VERIFIED'}
                </h3>
                <StatusBadge status={report?.status || 'VALID'} size="md" />
              </div>
              <p className={`text-xs mt-1.5 leading-relaxed ${isTampered ? 'text-rose-200' : 'text-slate-300'}`}>
                {report?.summary || 'All records cryptographically verified across SHA-256 chain.'}
              </p>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">
                Last Verified: {report ? new Date(report.verified_at).toLocaleString() : 'Just now'} &bull; Engine: Python 3.13 hashlib
              </div>
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block">CHECKED</span>
              <span className="text-base font-bold text-white">{report?.records_checked ?? 0}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-[10px] text-emerald-400 block">VALID</span>
              <span className="text-base font-bold text-emerald-400">{report?.valid_records ?? 0}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center px-2">
              <span className={`text-[10px] block ${isTampered ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>INVALID</span>
              <span className={`text-base font-bold ${isTampered ? 'text-rose-400' : 'text-slate-400'}`}>
                {report?.invalid_records ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-700/50 text-xs text-cyan-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tampering Discrepancy Diff Viewer (Visible When Tampering Detected) */}
      {isTampered && report?.invalid_details && report.invalid_details.length > 0 && (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-600/60 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Detailed Cryptographic Discrepancy & Tamper Analysis
          </div>

          {report.invalid_details.map((inv, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/90 border border-rose-700/50 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-rose-400 text-sm">
                  Compromised Block: Sequence #{inv.sequence_no}
                </span>
                <span className="text-slate-400 font-mono">
                  Student: {inv.student_roll} ({inv.student_name})
                </span>
              </div>

              {/* Error Explanations */}
              <div className="space-y-1">
                {inv.errors?.map((err, errIdx) => (
                  <div key={errIdx} className="text-rose-300 flex items-start gap-1.5 font-medium">
                    <span className="text-rose-400 font-bold">&bull;</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>

              {/* Exact Difference Between Payloads */}
              {inv.expected_payload && inv.stored_payload && (
                <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-rose-400 uppercase text-[10px] font-sans font-bold block">
                      Live Column Expected Payload (Current modified database row):
                    </span>
                    <div className="p-2 bg-rose-950/60 rounded border border-rose-800/60 text-rose-200 break-all">
                      {inv.expected_payload}
                    </div>
                  </div>

                  <div>
                    <span className="text-emerald-400 uppercase text-[10px] font-sans font-bold block">
                      Stored Canonical Payload (Original hash payload at insertion):
                    </span>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300 break-all">
                      {inv.stored_payload}
                    </div>
                  </div>
                </div>
              )}

              {/* Hash Mismatch */}
              {inv.stored_hash && inv.calculated_hash && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px] font-sans">Stored Database Hash</span>
                    <span className="text-slate-300 break-all">{inv.stored_hash}</span>
                  </div>
                  <div className="p-2 bg-rose-950/60 rounded border border-rose-800/60">
                    <span className="text-rose-400 block text-[10px] font-sans">Calculated Python Hash</span>
                    <span className="text-rose-300 break-all">{inv.calculated_hash}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Lab: Interactive Tamper Demonstration Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-400" />
              Automated Tampering Experiment & Demonstration Lab
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an unauthorized direct SQL <code className="text-cyan-300 font-mono">UPDATE</code> bypassing application logic to demonstrate real-time detection
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
            DEMO_MODE=true
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-end">
          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold">Target Sequence Number</label>
            <input
              type="number"
              min="1"
              value={tamperSeq}
              onChange={(e) => setTamperSeq(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold">Altered Marks Value (0 - 100)</label>
            <input
              type="number"
              step="0.1"
              value={tamperMarks}
              onChange={(e) => setTamperMarks(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSimulateTamper}
              disabled={isTampering}
              className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {isTampering ? 'Altering SQL...' : 'Simulate Tampering'}
            </button>

            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {isRestoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>

        {/* SQL Explanation */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="text-slate-500 font-sans font-semibold">SQL Executed in Background:</div>
          <div className="text-cyan-300">
            UPDATE marks_ledger SET marks = {tamperMarks} WHERE sequence_no = {tamperSeq};
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            Because NO trigger updates `hash_payload` or `current_hash` on UPDATE, the record's payload diverges from its live columns, triggering instant verification alarm.
          </div>
        </div>
      </div>
    </div>
  );
};
