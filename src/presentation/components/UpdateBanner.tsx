import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, ArrowRight, X } from 'lucide-react';
import type { UpdaterStatus } from '../../types';

export const UpdateBanner: React.FC = () => {
  const [updaterState, setUpdaterState] = useState<UpdaterStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) return;

    const cleanup = window.electronAPI.onUpdateStatus((status) => {
      setUpdaterState(status);
      if (status.status === 'downloaded' || status.status === 'available') {
        setIsDismissed(false);
      }
    });

    return () => {
      cleanup?.();
    };
  }, []);

  if (!updaterState || isDismissed) return null;

  const handleInstall = () => {
    window.electronAPI?.installUpdate?.();
  };

  // Only show banner for interesting states: downloading or downloaded
  if (updaterState.status === 'downloading') {
    return (
      <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-50 animate-in fade-in">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" />
          <span>Baixando atualização do Quantora: {updaterState.percent ?? 0}%...</span>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white"
          title="Fechar"
          aria-label="Fechar banner de atualização"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (updaterState.status === 'downloaded') {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-lg z-50 animate-in slide-in-from-top">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-300 fill-yellow-300" />
          <span>Nova versão {updaterState.version ? `v${updaterState.version}` : ''} pronta para ser aplicada!</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1 bg-white text-emerald-800 rounded-lg font-black text-xs hover:bg-slate-100 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            Reiniciar e Atualizar <ArrowRight size={12} />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-white/80 hover:text-white ml-2"
            title="Fechar"
            aria-label="Fechar banner de atualização"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
