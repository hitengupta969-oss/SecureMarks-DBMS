import React from 'react';
import { ArrowRight, Link2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LedgerRecord } from '../types';
import { HashBadge } from './HashBadge';

interface Props {
  records: LedgerRecord[];
  onSelectRecord?: (record: LedgerRecord) => void;
  selectedSequence?: number | null;
  tamperedSequences?: number[];
}

export const ChainVisualizer: React.FC<Props> = ({
  records,
  onSelectRecord,
  selectedSequence,
  tamperedSequences = []
}) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
        No ledger blocks recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2">
      <div className="flex items-center gap-3 min-w-max px-2">
        {records.map((rec, idx) => {
          const isTampered = tamperedSequences.includes(rec.sequence_no);
          const isSelected = selectedSequence === rec.sequence_no;
          const isGenesis = rec.sequence_no === 1;

          return (
            <React.Fragment key={rec.sequence_no}>
              {/* Ledger Block */}
              <div
                onClick={() => onSelectRecord?.(rec)}
                className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer w-64 ${
                  isTampered
                    ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/50'
                    : isSelected
                    ? 'bg-slate-850 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      isGenesis ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/40' : 'bg-slate-800 text-slate-200'
                    }`}>
                      Seq #{rec.sequence_no}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {rec.event_type === 'MARK_CORRECTED' ? 'Correction' : 'Entry'}
                    </span>
                  </div>
                  {isTampered ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                {/* Block Content Snapshot */}
                <div className="text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student:</span>
                    <span className="font-semibold text-slate-200">{rec.student_roll_snapshot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subject:</span>
                    <span className="text-slate-300 font-mono">{rec.subject_code_snapshot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Marks:</span>
                    <span className={`font-bold ${isTampered ? 'text-rose-400 text-sm' : 'text-emerald-400'}`}>
                      {Number(rec.marks).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Hash Linkages */}
                <div className="border-t border-slate-800/80 pt-2 text-[11px] space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Prev:</span>
                    <HashBadge hash={rec.previous_hash} truncateLength={4} />
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-cyan-400/80 font-sans font-semibold">Curr:</span>
                    <HashBadge hash={rec.current_hash} truncateLength={4} />
                  </div>
                </div>
              </div>

              {/* Connecting Arrow */}
              {idx < records.length - 1 && (
                <div className="flex flex-col items-center justify-center text-slate-600 px-1">
                  <Link2 className="w-3.5 h-3.5 mb-1 text-cyan-500/60" />
                  <ArrowRight className="w-4 h-4 text-cyan-400/80" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
