import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Mail,
  Key,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  getCurrentUser,
  signInWithGoogle,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  signInWithMagicLink,
  signOutCloud,
} from '../../core/auth/supabaseClient';
import { syncWithCloud, type SyncResult } from '../../core/auth/cloudSync';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../core/i18n/translations';
import type { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const language = useAppStore((s) => s.settings.language || 'pt');
  const t = useTranslation(language);

  const [configured, setConfigured] = useState(isSupabaseConfigured());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'magic'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Manual Credentials configuration form
  const [customUrl, setCustomUrl] = useState(() => getSupabaseCredentials().url);
  const [customKey, setCustomKey] = useState(() => getSupabaseCredentials().anonKey);
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getCurrentUser().then((user) => {
      setCurrentUser(user);
      setConfigured(isSupabaseConfigured());
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setStatusMessage({ text: 'Preencha a URL e a Anon Key do Supabase.', isError: true });
      return;
    }

    try {
      localStorage.setItem('quantora_supabase_url', customUrl.trim());
      localStorage.setItem('quantora_supabase_anon_key', customKey.trim());
      setConfigured(isSupabaseConfigured());
      setShowConfigForm(false);
      setStatusMessage({ text: 'Credenciais salvas com sucesso!' });
      getCurrentUser().then(setCurrentUser);
    } catch {
      setStatusMessage({ text: 'Erro ao salvar credenciais.', isError: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    const { error } = await signInWithGoogle();
    setIsSubmitting(false);
    if (error) {
      setStatusMessage({ text: error.message, isError: true });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    if (authMode === 'magic') {
      const { error } = await signInWithMagicLink(email);
      setIsSubmitting(false);
      if (error) {
        setStatusMessage({ text: error.message, isError: true });
      } else {
        setStatusMessage({ text: 'Link mágico enviado para o seu e-mail! Verifique sua caixa de entrada.' });
      }
      return;
    }

    if (!password) {
      setIsSubmitting(false);
      setStatusMessage({ text: 'Digite sua senha.', isError: true });
      return;
    }

    if (authMode === 'login') {
      const { user, error } = await signInWithEmailPassword(email, password);
      setIsSubmitting(false);
      if (error) {
        setStatusMessage({ text: error.message, isError: true });
      } else {
        setCurrentUser(user);
        setStatusMessage({ text: 'Login realizado com sucesso!' });
        handleTriggerSync();
      }
    } else {
      const { user, error } = await signUpWithEmailPassword(email, password);
      setIsSubmitting(false);
      if (error) {
        setStatusMessage({ text: error.message, isError: true });
      } else {
        setCurrentUser(user);
        setStatusMessage({ text: 'Conta criada com sucesso! Sincronizando dados...' });
        handleTriggerSync();
      }
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOutCloud();
    setCurrentUser(null);
    setIsSubmitting(false);
    setStatusMessage({ text: 'Conta desconectada. Modo local ativo.' });
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    const res: SyncResult = await syncWithCloud();
    setIsSyncing(false);

    if (res.status === 'synced') {
      setStatusMessage({ text: `${t.synced_success} (${res.totalXp} XP)` });
    } else if (res.status === 'error') {
      setStatusMessage({ text: res.message, isError: true });
    } else if (res.status === 'not_authenticated') {
      setStatusMessage({ text: 'Faça login para sincronizar.', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{t.auth_title}</h2>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} /> Offline-First Garantido
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            aria-label={t.close}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.auth_subtitle}
          </p>

          {/* User logged in screen */}
          {currentUser ? (
            <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-700 dark:text-cyan-400">
                    {t.signed_in_as}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                    {currentUser.email || 'Usuário Google'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              <div className="pt-2 border-t border-cyan-100 dark:border-cyan-900/50 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? t.syncing : t.sync_now}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <LogOut size={15} />
                  {t.sign_out}
                </button>
              </div>
            </div>
          ) : !configured || showConfigForm ? (
            /* Supabase Configuration Form */
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {t.supabase_not_configured}
                  </h3>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                    {t.supabase_config_help}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-2.5 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.supabase_url_label}
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.supabase_key_label}
                  </label>
                  <input
                    type="text"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    {t.save_config}
                  </button>
                  {configured && (
                    <button
                      type="button"
                      onClick={() => setShowConfigForm(false)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    >
                      {t.cancel}
                    </button>
                  )}
                </div>
              </form>

              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline pt-1"
              >
                Criar banco gratuito no Supabase <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            /* Login & Sign Up Options */
            <div className="space-y-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-white font-bold text-xs transition-all shadow-sm touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {t.sign_in_with_google}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ou
                </span>
              </div>

              {/* Auth Mode Tabs */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Criar Conta
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('magic')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'magic'
                      ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Link Mágico
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t.email_label}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                {authMode !== 'magic' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {t.password_label}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                      <Key size={16} className="absolute left-3 top-3 text-slate-400" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : authMode === 'signup' ? (
                    t.sign_up_with_email
                  ) : authMode === 'magic' ? (
                    t.magic_link
                  ) : (
                    t.sign_in_with_email
                  )}
                </button>
              </form>

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowConfigForm(true)}
                  className="hover:underline text-cyan-600 dark:text-cyan-400 font-semibold cursor-pointer"
                >
                  Configurar chaves Supabase
                </button>
                <span className="flex items-center gap-1">
                  <Zap size={11} className="text-amber-500" /> Sincronização atômica
                </span>
              </div>
            </div>
          )}

          {/* Feedback Status */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {statusMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Notice about conflict-free progression */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldCheck size={14} className="text-cyan-500 shrink-0 mt-0.5" />
            <p>{t.cloud_merge_notice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
