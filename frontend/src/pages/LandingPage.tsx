import React from 'react';
import { ShieldCheck, Database, Cpu, ArrowRight, Lock, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onExploreResearch: () => void;
}

export const LandingPage: React.FC<Props> = ({ onGetStarted, onExploreResearch }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-950 border-b border-slate-800/80 px-6 py-2.5 text-xs text-center text-cyan-300 font-mono">
        Topic 11 &bull; Academic DBMS Project: "Can tamper-evident ledgers replace audit logs in a DBMS?"
      </div>

      {/* Hero Section */}
      <div className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          PostgreSQL 16 &bull; pgcrypto Extension &bull; SHA-256 Ledger
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Tamper-Evident Marks Register Using{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
            Hash-Chained Database Ledger
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Demonstrating cryptographic hash chaining directly inside a relational DBMS. PostgreSQL SQL triggers enforce immutable sequence-ordered hashes, while an independent Python verification engine detects unauthorized direct database alterations.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
          >
            Launch System Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreResearch}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
          >
            Read Research Article
          </button>
        </div>

        {/* Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/40 flex items-center justify-center text-blue-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">PostgreSQL SQL Triggers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every newly inserted student marks record triggers a deterministic canonical payload generation, locking singleton state and computing the SHA-256 hash using native pgcrypto.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/40 flex items-center justify-center text-cyan-400 mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Python Verification Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              An independent Python service recalculates hashes from live table columns using standard hashlib SHA-256, immediately spotting any manual SQL update or data tampering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/40 flex items-center justify-center text-amber-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">ESP32 IoT Physical Terminal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Physical or simulated smart terminal with 0.96" SSD1306 OLED, 4x4 keypad, green/red status LEDs, and buzzer for physical tamper alerting directly from the backend API.
            </p>
          </div>
        </div>

        {/* Verification Flow Diagram */}
        <div className="mt-16 w-full p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">
            Hash-Chain Ingestion & Tamper Detection Lifecycle
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300">
            <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">1. Faculty Enters Mark</div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">2. SQL Trigger Locks State</div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">3. pgcrypto SHA-256 Chained</div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <div className="px-3 py-2 rounded-lg bg-blue-950 border border-blue-600 text-blue-300">4. Immutable Block Appended</div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <div className="px-3 py-2 rounded-lg bg-rose-950 border border-rose-600 text-rose-300">5. Unauthorized UPDATE Detected</div>
          </div>
        </div>
      </div>
    </div>
  );
};
