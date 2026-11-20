import React from 'react';
import { AlertOctagon, ShieldCheck, ChevronRight } from 'lucide-react';
import { VerificationReport } from '../types';

interface Props {
  report: VerificationReport | null;
  onNavigateToVerify?: () => void;
}

export const AlertBanner: React.FC<Props> = ({ report, onNavigateToVerify }) => {
  if (!report) return null;

  if (report.status === 'TAMPERING_DETECTED' || report.status === 'CHAIN_BROKEN') {
    return (
      <div className="bg-rose-950/80 border border-rose-600/70 rounded-xl p-4 mb-6 shadow-lg shadow-rose-950/50 backdrop-blur-sm animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-900/60 rounded-lg text-rose-300 mt-0.5 border border-rose-500/30">
              <AlertOctagon className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-200 tracking-wide">CRYPTOGRAPHIC INTEGRITY VIOLATION DETECTED</span>
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {report.invalid_records} Record(s) Compromised
                </span>
              </div>
              <p className="text-sm text-rose-200/90 mt-1">
                {report.summary} Direct database unauthorized modification detected by independent Python SHA-256 verifier.
              </p>
              {report.invalid_details && report.invalid_details.length > 0 && (
                <div className="mt-2 text-xs text-rose-300 font-mono bg-rose-900/40 p-2 rounded border border-rose-700/40">
                  Target: Sequence #{report.invalid_details[0].sequence_no} | Student: {report.invalid_details[0].student_roll || 'N/A'}
                  {report.invalid_details[0].errors && (
                    <span className="block text-rose-200 mt-0.5 font-sans">
                      &bull; {report.invalid_details[0].errors[0]}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {onNavigateToVerify && (
            <button
              onClick={onNavigateToVerify}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap shadow-sm"
            >
              Investigate Discrepancy
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-3 mb-6 shadow-sm flex items-center justify-between text-xs text-emerald-200/90">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-emerald-900/40 rounded text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span>
          <strong className="text-emerald-300">LEDGER INTEGRITY VERIFIED:</strong> All records cryptographically chained through PostgreSQL pgcrypto SHA-256. Last verified: {new Date(report.verified_at).toLocaleTimeString()}.
        </span>
      </div>
      {onNavigateToVerify && (
        <button
          onClick={onNavigateToVerify}
          className="text-emerald-400 hover:text-emerald-300 font-medium underline flex items-center gap-1"
        >
          View Cryptographic Proofs
        </button>
      )}
    </div>
  );
};
