import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  hash: string;
  label?: string;
  truncateLength?: number;
}

export const HashBadge: React.FC<Props> = ({ hash, label, truncateLength = 10 }) => {
  const [copied, setCopied] = useState(false);

  const cleanHash = hash ? hash.trim() : '';
  const isGenesis = cleanHash === '0'.repeat(64);
  const truncated = cleanHash.length > truncateLength * 2
    ? `${cleanHash.substring(0, truncateLength)}...${cleanHash.substring(cleanHash.length - 6)}`
    : cleanHash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs">
      {label && <span className="text-slate-400 font-sans text-xs">{label}:</span>}
      <div 
        onClick={handleCopy}
        title={`Click to copy full SHA-256 hash:\n${cleanHash}`}
        className={`group flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer border transition-all ${
          isGenesis 
            ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500' 
            : 'bg-slate-900/90 text-cyan-300 border-cyan-800/40 hover:border-cyan-500/80 hover:bg-slate-850'
        }`}
      >
        <span>{truncated}</span>
        {copied ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : (
          <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        )}
      </div>
    </div>
  );
};
