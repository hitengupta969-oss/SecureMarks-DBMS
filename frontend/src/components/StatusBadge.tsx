import React from 'react';
import { ShieldCheck, AlertTriangle, Link2Off, HelpCircle } from 'lucide-react';

interface Props {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const baseClasses = `inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${
    isLg ? 'px-4 py-1.5 text-sm tracking-wide' : isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
  }`;

  switch (status) {
    case 'VALID':
    case 'LEDGER_VALID':
      return (
        <span className={`${baseClasses} bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950`}>
          <ShieldCheck className={isLg ? 'w-4 h-4 text-emerald-400' : 'w-3.5 h-3.5 text-emerald-400'} />
          LEDGER VALID
        </span>
      );
    case 'TAMPERING_DETECTED':
      return (
        <span className={`${baseClasses} bg-rose-950/90 text-rose-300 border-rose-500/60 animate-pulse shadow-md shadow-rose-950`}>
          <AlertTriangle className={isLg ? 'w-4 h-4 text-rose-400' : 'w-3.5 h-3.5 text-rose-400'} />
          TAMPERING DETECTED
        </span>
      );
    case 'CHAIN_BROKEN':
      return (
        <span className={`${baseClasses} bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950`}>
          <Link2Off className={isLg ? 'w-4 h-4 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
          CHAIN BROKEN
        </span>
      );
    case 'EMPTY_LEDGER':
      return (
        <span className={`${baseClasses} bg-slate-800 text-slate-300 border-slate-700`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          EMPTY LEDGER
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-slate-800 text-slate-300 border-slate-700`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          {status}
        </span>
      );
  }
};
