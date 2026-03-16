import { useApp } from '../../context';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Toast() {
  const { toast, showToast } = useApp();
  if (!toast) return null;

  const configs = {
    success: { bg: 'bg-emerald-600', icon: <CheckCircle size={18} /> },
    error: { bg: 'bg-red-600', icon: <XCircle size={18} /> },
    warning: { bg: 'bg-amber-500', icon: <AlertTriangle size={18} /> },
    info: { bg: 'bg-blue-600', icon: <Info size={18} /> },
  };
  const cfg = configs[toast.type];

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white ${cfg.bg} animate-slide-up max-w-sm`}>
      {cfg.icon}
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={() => showToast('', 'info')} className="ml-2 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
