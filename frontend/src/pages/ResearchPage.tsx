import React from 'react';
import { BookOpen, Shield, Database, Cpu, Lock, CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';

export const ResearchPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 mb-3">
          Topic 11 &bull; Academic Research Paper & Technical Architecture
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Can Tamper-Evident Ledgers Replace Audit Logs in a DBMS?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          An investigation into cryptographic hash-chaining within relational database engines for high-integrity academic evaluation registers.
        </p>
      </div>

      {/* Abstract */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">1. Abstract</h3>
        <p className="text-xs text-slate-300 leading-relaxed text-justify">
          Traditional relational database management systems rely heavily on mutable audit log tables to record user activity and maintain compliance. However, conventional audit logs are susceptible to silent tampering by malicious database administrators (DBAs) or compromised application service credentials possessing DDL/DML update privileges. This research demonstrates an integrated relational architecture using PostgreSQL and its native <code className="text-cyan-300 font-mono">pgcrypto</code> extension to construct a centralized, append-only, hash-chained evaluation ledger. Using transactional <code className="text-cyan-300 font-mono">BEFORE INSERT</code> SQL triggers, each academic mark record binds to its antecedent through a 256-bit SHA-256 cryptographic digest. We demonstrate through an independent Python verification engine and physical ESP32 terminal alerts that any subsequent direct modification to historical marks is detected without relying on expensive, energy-intensive distributed consensus protocols.
        </p>
      </div>

      {/* Core Concepts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          2. Theoretical Foundations & Cryptographic Primitives
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-xs">What is a Hash Chain?</h4>
            <p className="text-slate-400 leading-relaxed">
              A hash chain is a succession of cryptographic hash values where each block incorporates the hash of its preceding block:
            </p>
            <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-cyan-300">
              H(i) = SHA256(Payload(i) || H(i-1))
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Altering any historical record changes its hash, which breaks the link to all subsequent records in the sequence.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-xs">SHA-256 Cryptographic Hash Function</h4>
            <p className="text-slate-400 leading-relaxed">
              A NIST-standardized one-way function that produces an immutable 256-bit (64 hex character) digest. It guarantees pre-image resistance and collision resistance: finding two distinct academic records with the same hash is computationally infeasible (&asymp; 2<sup>128</sup> operations).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-xs">PostgreSQL pgcrypto Extension</h4>
            <p className="text-slate-400 leading-relaxed">
              A built-in PostgreSQL cryptographic module enabling fast, in-engine computation of SHA-256 digests via <code className="text-cyan-300 font-mono">digest(data, 'sha256')</code> without context switching or network serialization to external hashing libraries.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-xs">SQL BEFORE INSERT Triggers</h4>
            <p className="text-slate-400 leading-relaxed">
              A database-level stored procedure that intercepts incoming marks insertions prior to physical storage on disk. By locking the singleton state row (<code className="text-cyan-300 font-mono">SELECT FOR UPDATE</code>), it strictly serializes concurrent insertions, preventing sequence collisions.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table: Centralized Hash-Chained Ledger vs Public Blockchain */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          3. Comparative Analysis: Centralized Hash Ledger vs. Public Blockchain
        </h3>

        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Evaluation Criterion</th>
                <th className="py-2.5 px-4 text-cyan-400 font-bold">SecureMarks Centralized Ledger</th>
                <th className="py-2.5 px-4 text-slate-400">Public Blockchain (e.g., Ethereum)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Underlying DBMS</td>
                <td className="py-2.5 px-4 font-mono text-cyan-300">PostgreSQL (Relational)</td>
                <td className="py-2.5 px-4">Distributed Ledger / P2P State Machine</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Consensus Overhead</td>
                <td className="py-2.5 px-4 text-emerald-400">Zero (ACID Transaction Locks)</td>
                <td className="py-2.5 px-4">Proof of Stake / Proof of Work (Latency &gt; 12s)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Throughput (TPS)</td>
                <td className="py-2.5 px-4 text-emerald-400">&gt; 3,500 Writes/sec</td>
                <td className="py-2.5 px-4">15 - 30 Writes/sec</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Transaction Costs (Gas)</td>
                <td className="py-2.5 px-4 text-emerald-400">Free (Internal Compute)</td>
                <td className="py-2.5 px-4 text-rose-400">High Gas Fees per transaction</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Relational Query Power</td>
                <td className="py-2.5 px-4 text-emerald-400">Full SQL Joins, Views, Aggregates</td>
                <td className="py-2.5 px-4">Key-Value Triestree, Latency &gt; 12s</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Tamper Detection Method</td>
                <td className="py-2.5 px-4 text-cyan-300">Independent Python SHA-256 Verifier</td>
                <td className="py-2.5 px-4">Byzantine Fault Tolerant Voting</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Limitations & Defense-in-Depth */}
      <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-600/40 space-y-2">
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          4. Security Boundary & Fundamental Limitation
        </h3>
        <p className="text-xs text-amber-200/90 leading-relaxed text-justify">
          <strong>Centralized ledger databases are tamper-evident, not absolutely tamper-proof.</strong> If an adversary acquires superuser privileges on the underlying operating system or PostgreSQL database instance (<code className="text-amber-300 font-mono">postgres</code> superuser), they possess the technical capability to modify a mark, regenerate all subsequent hashes in the chain, and update the singleton <code className="text-amber-300 font-mono">ledger_state</code> row. To mitigate this threat in enterprise deployments, organizations should anchor daily cryptographic checkpoints to external timestamping services or write-once-read-many (WORM) storage.
        </p>
      </div>

      {/* Academic Citations */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          5. Key Academic References
        </h3>
        <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 font-mono">
          <li>Haber, S., & Stornetta, W. S. (1991). <em>How to time-stamp a digital document</em>. Journal of Cryptology, 3(2), 99-111.</li>
          <li>Merkle, R. C. (1988). <em>A digital signature based on a conventional encryption function</em>. Advances in Cryptology — CRYPTO ’87, 369-378.</li>
          <li>Snodgrass, R. T., Yao, S. S., & Collberg, C. (2004). <em>Tamper detection in audit logs</em>. In Proceedings of the 30th VLDB Conference, 504-515.</li>
          <li>PostgreSQL Global Development Group (2026). <em>The pgcrypto Module Documentation</em>. PostgreSQL 16 Reference Manual.</li>
        </ol>
      </div>
    </div>
  );
};
