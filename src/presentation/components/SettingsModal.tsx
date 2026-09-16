import React, { useRef, useState, useEffect } from 'react';
import { X, Moon, Sun, Laptop, Trash2, Download, Upload, ShieldCheck, CheckCircle2, RefreshCw, Sparkles, Globe, Volume2, VolumeX, Unlock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { DecimalPlaces, DecimalSeparator, ThemeMode, UpdaterStatus, AppLanguage } from '../../types';
import { validateHistorySchema } from '../../core/storage/historyValidator';
import { useTranslation } from '../../core/i18n/translations';
import { getDeviceLocalDateString } from '../../core/gamification/leveling';
import { playTestSound } from '../../core/platform/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Move regex outside to avoid recompilation on every cell
const QUOTE_REGEX = /"/g;

// RFC 4180 compliant CSV field escaping
const escapeCSVField = (val: unknown): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(QUOTE_REGEX, '""')}"`;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, clearHistory, importHistory } = useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      updateSettings: s.updateSettings,
      clearHistory: s.clearHistory,
      importHistory: s.importHistory,
    }))
  );
  const t = useTranslation(settings.language || 'pt');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdaterStatus | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showTemporaryStatus = (msg: string) => {
    setImportStatus(msg);
    setTimeout(() => setImportStatus(null), 3000);
  };

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) return;
    const cleanup = window.electronAPI.onUpdateStatus((status) => {
      setUpdateStatus(status);
      if (status.status !== 'checking') {
        setIsCheckingUpdate(false);
      }
    });
    return () => cleanup?.();
  }, []);

  const handleCheckUpdate = async () => {
    if (!window.electronAPI?.checkForUpdates) {
      setUpdateStatus({
        status: 'not-available',
        message: 'Atualizações automáticas ativas no executável Windows desktop.',
      });
      return;
    }
    setIsCheckingUpdate(true);
    setUpdateStatus({ status: 'checking', message: 'Conectando ao GitHub para verificar novidades...' });
    const res = await window.electronAPI.checkForUpdates();
    setIsCheckingUpdate(false);
    if (!res.success && res.error) {
      setUpdateStatus({ status: 'error', message: res.error });
    }
  };

  if (!isOpen) return null;

  const generateCSVContent = (): string => {
    const history = useAppStore.getState().history;
    const headers = ['ID', 'Data/Hora', 'Tipo', 'Título', 'Resumo', 'Passo a Passo', 'Favorito'];
    const rows = history.map((item) => [
      escapeCSVField(item.id),
      escapeCSVField(new Date(item.timestamp).toLocaleString('pt-BR')),
      escapeCSVField(item.type),
      escapeCSVField(item.title),
      escapeCSVField(item.summary),
      escapeCSVField(item.details),
      escapeCSVField(item.isPinned ? 'Sim' : 'Não'),
    ]);

    return [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  };

  // Export JSON (Native Electron or Web Download)
  const handleExportJSON = async () => {
    const history = useAppStore.getState().history;
    const jsonStr = JSON.stringify(history, null, 2);
    const defaultName = `quantora-historico-${getDeviceLocalDateString()}.json`;

    if (window.electronAPI?.saveFile) {
      const res = await window.electronAPI.saveFile(defaultName, jsonStr, [
        { name: 'Arquivos JSON', extensions: ['json'] },
      ]);
      if (res.success) {
        showTemporaryStatus(t.backup_saved_success);
      } else if (res.error) {
        setImportStatus(`${t.export_error} ${res.error}`);
      }
      return;
    }

    // Web Fallback
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', defaultName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV (Native Electron or Web Download)
  const handleExportCSV = async () => {
    const csvContent = generateCSVContent();
    const defaultName = `quantora-historico-${getDeviceLocalDateString()}.csv`;

    if (window.electronAPI?.saveFile) {
      const res = await window.electronAPI.saveFile(defaultName, '\ufeff' + csvContent, [
        { name: 'Arquivos CSV', extensions: ['csv'] },
      ]);
      if (res.success) {
        showTemporaryStatus(t.backup_saved_success);
      } else if (res.error) {
        setImportStatus(`${t.export_error} ${res.error}`);
      }
      return;
    }

    // Web Fallback
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', defaultName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Import JSON file (Native Electron Dialog or HTML5 file picker fallback)
  const handleImport = async () => {
    if (window.electronAPI?.openFile) {
      const res = await window.electronAPI.openFile([
        { name: 'Arquivos JSON', extensions: ['json'] },
      ]);
      if (res.canceled) return;
      if (res.success && res.data) {
        importHistory(res.data);
        showTemporaryStatus(t.backup_imported_success);
      } else {
        setImportStatus(res.error || t.backup_invalid);
      }
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB limit to prevent browser crashes on JSON.parse
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setImportStatus(t.file_too_large || 'File is too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateHistorySchema(parsed);

        if (validation.valid && validation.data) {
          importHistory(validation.data);
          showTemporaryStatus(t.backup_imported_success);
        } else {
          setImportStatus(validation.error || t.backup_invalid);
        }
      } catch {
        setImportStatus(t.backup_invalid);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.settings_title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
            aria-label={t.close}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Theme */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.theme}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { mode: 'light', label: t.theme_light, icon: <Sun size={18} /> },
                  { mode: 'dark', label: t.theme_dark, icon: <Moon size={18} /> },
                  { mode: 'system', label: t.theme_system, icon: <Laptop size={18} /> },
                ] as const
              ).map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => updateSettings({ theme: item.mode as ThemeMode })}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border font-semibold transition-all touch-target ${
                    settings.theme === item.mode
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-500" /> {t.language}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { lang: 'pt', label: t.lang_pt },
                { lang: 'en', label: t.lang_en },
              ].map((item) => (
                <button
                  key={item.lang}
                  type="button"
                  onClick={() => updateSettings({ language: item.lang as AppLanguage })}
                  className={`p-3 rounded-2xl border font-bold text-center transition-all touch-target ${
                    (settings.language || 'pt') === item.lang
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Efeitos Sonoros (SFX) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl transition-colors ${
                  settings.soundEnabled ?? true
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {(settings.soundEnabled ?? true) ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {t.sound_effects}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t.sound_effects_desc}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled ?? true}
                onClick={() => {
                  const next = !(settings.soundEnabled ?? true);
                  updateSettings({ soundEnabled: next });
                  if (next) playTestSound(settings.soundVolume ?? 0.5);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50 cursor-pointer ${
                  (settings.soundEnabled ?? true) ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (settings.soundEnabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {(settings.soundEnabled ?? true) && (
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {t.sound_volume}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                      {Math.round((settings.soundVolume ?? 0.5) * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => playTestSound(settings.soundVolume ?? 0.5)}
                      className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title={t.sound_test}
                    >
                      {t.sound_test}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume ?? 0.5}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateSettings({ soundVolume: val });
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Progressive Onboarding Override Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Unlock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.settings_unlock_all || 'Desbloquear Todos os Recursos'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.settings_unlock_all_desc || 'Pula a progressão e libera todos os modos de jogo imediatamente.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings.unlockAllFeatures)}
                onClick={() => updateSettings({ unlockAllFeatures: !settings.unlockAllFeatures })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${
                  settings.unlockAllFeatures ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.unlockAllFeatures ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Decimal Places */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.precision}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([2, 4, 6] as DecimalPlaces[]).map((places) => (
                <button
                  key={places}
                  type="button"
                  onClick={() => updateSettings({ decimalPlaces: places })}
                  className={`p-3 rounded-2xl border font-semibold text-center transition-all touch-target ${
                    settings.decimalPlaces === places
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {places} {t.decimals_suffix}
                </button>
              ))}
            </div>
          </div>

          {/* Decimal Separator */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.separator}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { sep: ',', label: t.separator_comma },
                  { sep: '.', label: t.separator_dot },
                ] as const
              ).map((item) => (
                <button
                  key={item.sep}
                  type="button"
                  onClick={() => updateSettings({ decimalSeparator: item.sep as DecimalSeparator })}
                  className={`p-3 rounded-2xl border font-semibold text-center transition-all touch-target ${
                    settings.decimalSeparator === item.sep
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* History Management */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.backup_data} ({history.length} {t.saved_items})
            </label>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={handleExportJSON}
                disabled={history.length === 0}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold text-xs touch-target disabled:opacity-40"
              >
                <Download size={16} /> {t.export_json}
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={history.length === 0}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold text-xs touch-target disabled:opacity-40"
              >
                <Download size={16} /> {t.export_csv}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImport}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold text-xs touch-target"
              >
                <Upload size={16} /> {t.import_json}
              </button>

              {importStatus && (
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-xl">
                  <CheckCircle2 size={16} /> {importStatus}
                </div>
              )}
            </div>

            {/* Clear History */}
            <div className="mt-3">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearHistory();
                      setConfirmClear(false);
                    }}
                    className="flex-1 p-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs touch-target"
                  >
                    {t.confirm_clear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-semibold text-xs touch-target"
                  >
                    {t.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  disabled={history.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-semibold text-xs touch-target disabled:opacity-40"
                >
                  <Trash2 size={16} /> {t.clear_history}
                </button>
              )}
            </div>
          </div>

          {/* App Updates Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <RefreshCw size={16} className={isCheckingUpdate ? 'animate-spin text-indigo-500' : 'text-indigo-500'} />
                  {t.updates_title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quantora v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.1'} ({t.updates_subtitle})
                </p>
              </div>

              {updateStatus?.status === 'downloaded' ? (
                <button
                  type="button"
                  onClick={() => window.electronAPI?.installUpdate?.()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                >
                  <Sparkles size={14} /> {t.update_now}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isCheckingUpdate || updateStatus?.status === 'downloading'}
                  onClick={handleCheckUpdate}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isCheckingUpdate ? t.checking_updates : t.check_updates}
                </button>
              )}
            </div>

            {updateStatus && (
              <div className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                <p className="font-medium">{updateStatus.message}</p>
                {updateStatus.status === 'downloading' && (
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                      style={{ width: `${updateStatus.percent ?? 0}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy & Offline Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <ShieldCheck size={22} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t.privacy_title}
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.privacy_desc}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center text-xs text-slate-400">
          <span>Quantora v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.1'} ({t.definitive_edition})</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold touch-target"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};
