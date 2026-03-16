import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option { value: string; label: string; }

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '', disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`} style={{ userSelect: 'none' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
        style={{
          background: open ? 'rgba(232,184,75,0.08)' : 'rgba(255,255,255,0.04)',
          border: open ? '1px solid rgba(232,184,75,0.35)' : '1px solid rgba(255,255,255,0.08)',
          color: selected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'rgba(255,255,255,0.3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(8,14,26,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,184,75,0.06)',
            animation: 'selectDrop 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <style>{`
            @keyframes selectDrop {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div className="py-1 max-h-52 overflow-y-auto">
            {options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-all duration-100"
                  style={{
                    background: isSelected ? 'rgba(232,184,75,0.12)' : 'transparent',
                    color: isSelected ? '#e8b84b' : 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    if (!isSelected) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.95)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    if (!isSelected) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={13} style={{ color: '#e8b84b', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
