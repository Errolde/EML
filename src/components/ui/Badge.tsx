import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface Props {
  children: ReactNode;
  color?: 'gold' | 'blue' | 'green' | 'red' | 'purple' | 'gray' | 'orange';
  className?: string;
}

export function Badge({ children, color = 'blue', className }: Props) {
  const colors = {
    gold: 'bg-[#e8b84b]/20 text-[#e8b84b] border-[#e8b84b]/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gray: 'bg-white/10 text-white/60 border-white/10',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border', colors[color], className)}>
      {children}
    </span>
  );
}
