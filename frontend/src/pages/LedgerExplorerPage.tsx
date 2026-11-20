import React, { useEffect, useState } from 'react';
import { Link2, ShieldCheck, Database, Search, ArrowRight, Eye, X, Copy, Check, FileCode } from 'lucide-react';
import { api } from '../services/api';
import { LedgerRecord, LedgerState } from '../types';
import { HashBadge } from '../components/HashBadge';
import { ChainVisualizer } from '../components/ChainVisualizer';

export const LedgerExplorerPage: React.FC = () => {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [ledgerState, setLedgerState] = useState<LedgerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LedgerRecord | null>(null);
  const [searchSeq, setSearchSeq] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const [recs, st] = await Promise.all([
        api.getLedgerRecords(150, 0),
        api.getLedgerStatus(),
      ]);
      setRecords(recs);
      setLedgerState(st);
      if (recs.length > 0 && !selectedRecord) {
        setSelectedRecord(recs[recs.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load ledger records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = searchSeq
    ? records.filter((r) => r.sequence_no.toString().includes(searchSeq) || r.student_roll_snapshot.toLowerCase().includes(searchSeq.toLowerCase()))
    : records;

  const handleCopyPayload = () => {
    if (selectedRecord) {
      navigator.clipboard.writeText(selectedRecord.hash_payload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Chain State Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Cryptographic Ledger Explorer & Hash Chain
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only linear chain serialized by PostgreSQL singleton locking and pgcrypto SHA-256
          </p>
        </div>

        {ledgerState && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT HEAD</span>
              <span className="text-cyan-300 font-bold">Seq #{ledgerState.last_sequence}</span>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-2" />
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL BLOCKS</span>
              <span className="text-emerald-400 font-bold">{ledgerState.total_records} Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Chain Representation */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Sequential Cryptographic Block Chaining (<code className="text-cyan-300 font-mono">previous_hash &rarr; current_hash</code>)
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click block to inspect canonical payload
          </span>
        </div>
        <ChainVisualizer
          records={records}
          selectedSequence={selectedRecord?.sequence_no}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
        />
      </div>

      {/* Main Ledger Split: Records Table + Block Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table View (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchSeq}
                onChange={(e) => setSearchSeq(e.target.value)}
                placeholder="Filter by sequence # or student roll..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredRecords.length} block(s)
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
                <tr>
                  <th className="py-2.5 px-3">Seq</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Marks</th>
                  <th className="py-2.5 px-3">Previous Hash</th>
                  <th className="py-2.5 px-3">Current Hash</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Querying ledger blocks...
                    </td>
                  </tr>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((r) => {
                    const isSelected = selectedRecord?.sequence_no === r.sequence_no;
                    return (
                      <tr
                        key={r.sequence_no}
                        onClick={() => setSelectedRecord(r)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-850/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                          #{r.sequence_no}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-200">{r.student_roll_snapshot}</span>
                          <span className="text-[10px] text-slate-400 block">{r.student_name_snapshot}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {r.subject_code_snapshot}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">
                          {Number(r.marks).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <HashBadge hash={r.previous_hash} truncateLength={4} />
                        </td>
                        <td className="py-2.5 px-3">
                          <HashBadge hash={r.current_hash} truncateLength={4} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                            className="p-1 rounded text-cyan-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No matching ledger blocks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detailed Block & Canonical Payload Inspector */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800/50">
                    Block #{selectedRecord.sequence_no}
                  </div>
                  <span className="text-xs font-semibold text-slate-300 uppercase">
                    {selectedRecord.event_type}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: {selectedRecord.id}
                </span>
              </div>

              {/* Protected Snapshots */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Student</span>
                  <span className="font-semibold text-slate-200">{selectedRecord.student_name_snapshot}</span>
                  <span className="text-[10px] text-cyan-400 font-mono block">{selectedRecord.student_roll_snapshot}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Subject & Exam</span>
                  <span className="font-mono text-slate-200">{selectedRecord.subject_code_snapshot}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{selectedRecord.exam_name_snapshot}</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Academic Marks</span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    {Number(selectedRecord.marks).toFixed(2)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Timestamp:</span>
                  <div className="font-mono text-slate-300">{new Date(selectedRecord.created_at).toISOString()}</div>
                </div>
              </div>

              {/* Hashes */}
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block font-sans">
                    Previous Record Hash (Chained)
                  </span>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 break-all">
                    {selectedRecord.previous_hash}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-semibold block font-sans">
                    Current Block Hash (pgcrypto SHA-256)
                  </span>
                  <div className="p-2 bg-slate-950 rounded border border-cyan-800/40 text-[11px] text-cyan-300 break-all font-bold">
                    {selectedRecord.current_hash}
                  </div>
                </div>
              </div>

              {/* Deterministic Canonical Payload Display */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 font-sans">
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    Deterministic Canonical Payload (Raw SQL Input)
                  </span>
                  <button
                    onClick={handleCopyPayload}
                    className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPayload ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 break-all leading-relaxed max-h-36 overflow-y-auto">
                  {selectedRecord.hash_payload}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                  Covered by SHA-256 seal. Any direct modification to marks alters the expected canonical payload, causing instant detection.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Select any ledger sequence to view cryptographic proof.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
