import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, ...rest }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm',
        'focus:outline-none focus:border-[#e8b84b]/60 focus:ring-2 focus:ring-[#e8b84b]/20 transition-all',
        error && 'border-red-500/60',
        className
      )}
      {...rest}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Input.displayName = 'Input';
