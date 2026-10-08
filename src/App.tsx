import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { ModuleTopBar } from './presentation/components/ModuleTopBar';
import { SettingsModal } from './presentation/components/SettingsModal';
import { ProfileModal } from './presentation/components/ProfileModal';
import { AuthModal } from './presentation/components/AuthModal';
import { OnboardingModal } from './presentation/components/OnboardingModal';
import { UpdateBanner } from './presentation/components/UpdateBanner';
import { AchievementToast } from './presentation/components/AchievementToast';
import { FeatureUnlockToast } from './presentation/components/FeatureUnlockToast';
import { Scratchpad } from './presentation/components/Scratchpad';
import { CosmicHub } from './presentation/components/CosmicHub';
import { CosmicBackgroundCanvas } from './presentation/components/CosmicBackgroundCanvas';
import { LayoutGrid } from 'lucide-react';
import { isSupabaseConfigured, initCapacitorAuthListener } from './core/auth/supabaseClient';
import { syncWithCloud, initAutoSyncListener } from './core/auth/cloudSync';

// Code-splitting: Lazy load content modules on demand
const BhaskaraModule = lazy(() =>
  import('./presentation/modules/BhaskaraModule').then((m) => ({ default: m.BhaskaraModule }))
);
const RegraDeTresModule = lazy(() =>
  import('./presentation/modules/RegraDeTresModule').then((m) => ({ default: m.RegraDeTresModule }))
);
const PitagorasModule = lazy(() =>
  import('./presentation/modules/PitagorasModule').then((m) => ({ default: m.PitagorasModule }))
);
const PhysicsModule = lazy(() =>
  import('./presentation/modules/PhysicsModule').then((m) => ({ default: m.PhysicsModule }))
);
const HistoryModule = lazy(() =>
  import('./presentation/modules/HistoryModule').then((m) => ({ default: m.HistoryModule }))
);
const QuizModule = lazy(() =>
  import('./presentation/modules/QuizModule').then((m) => ({ default: m.QuizModule }))
);

function ModuleSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse pt-2">
      <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-80 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="lg:col-span-7 h-80 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    </div>
  );
}

export function App() {
  const { activeTab, setActiveTab, theme } = useAppStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      theme: s.settings.theme,
    }))
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([activeTab]));

  // Auto-sync listener, Capacitor deep link auth & initial background sync if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncWithCloud().catch(() => {});
    }
    const unsubscribeAutoSync = initAutoSyncListener();
    const cleanupCapacitor = initCapacitorAuthListener(() => {
      syncWithCloud().catch(() => {});
    });
    return () => {
      unsubscribeAutoSync();
      cleanupCapacitor();
    };
  }, []);

  // Track visited tabs synchronously during render
  if (!visitedTabs.has(activeTab)) {
    const newSet = new Set(visitedTabs);
    newSet.add(activeTab);
    setVisitedTabs(newSet);
  }

  // Sync theme with DOM root
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Dynamic Cosmic Background Canvas (Constelações Dinâmicas & Orbs de Nebulosa) */}
      <CosmicBackgroundCanvas />

      {/* Cosmic Nebula Ambient Glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ contain: 'strict' }}
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 sm:w-[600px] sm:h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[130px]" />
      </div>

      {/* Updater Toast Banner */}
      <UpdateBanner />

      {/* Achievement Toast with Confetti */}
      <AchievementToast />

      {/* Feature Unlock Toast with Confetti */}
      <FeatureUnlockToast />

      {/* Floating Scratchpad Board */}
      <Scratchpad />

      {/* Main Experience: Cosmic Hub Carousel OR Inner Calculator/Game Modules */}
      {activeTab === 'hub' ? (
        <CosmicHub
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      ) : (
        <>
          {/* Header Focado do Módulo (Sem HUD de abas!) */}
          <ModuleTopBar
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 pb-36 md:pb-16">
            <Suspense fallback={<ModuleSkeleton />}>
              {/* Static Modules (Keep mounted to preserve state) */}
              <div style={{ display: activeTab === 'bhaskara' ? 'block' : 'none' }}>
                {visitedTabs.has('bhaskara') && <BhaskaraModule />}
              </div>

              <div style={{ display: (activeTab === 'regra_simples' || activeTab === 'regra_composta') ? 'block' : 'none' }}>
                {(visitedTabs.has('regra_simples') || visitedTabs.has('regra_composta')) && <RegraDeTresModule />}
              </div>

              <div style={{ display: activeTab === 'pitagoras' ? 'block' : 'none' }}>
                {visitedTabs.has('pitagoras') && <PitagorasModule />}
              </div>

              <div style={{ display: activeTab === 'physics' ? 'block' : 'none' }}>
                {visitedTabs.has('physics') && <PhysicsModule />}
              </div>

              {/* Dynamic Modules (Unmount to reset state) */}
              {activeTab === 'quiz' && <QuizModule />}
              {activeTab === 'history' && <HistoryModule />}
            </Suspense>
          </main>

          {/* Floating Return to Cosmic Hub Button */}
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full cosmic-glass border border-cyan-500/40 text-cyan-400 dark:text-cyan-300 font-semibold text-xs tracking-wider uppercase shadow-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xl group"
            title="Voltar ao Hub Cósmico"
            aria-label="Voltar ao Hub Cósmico"
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
            <span>Hub</span>
          </button>
        </>
      )}

      {/* Modals */}
      {/*
        * ⚡ Bolt Performance Optimization
        * 💡 What: Conditionally mount ProfileModal and SettingsModal only when open.
        * 🎯 Why: Both modals use useAppStore hooks that subscribe to frequently changing state (historyLength, profile stats). When hidden via early returns, their hooks still ran on every update, causing invisible re-renders.
        * 📊 Impact: Eliminates unnecessary React subscription evaluations and render cycles when adding history items or gaining XP while modals are closed.
      */}
      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
      <OnboardingModal />
    </div>
  );
}

export default App;
