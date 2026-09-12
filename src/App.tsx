import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import { Navbar } from './presentation/components/Navbar';
import { SettingsModal } from './presentation/components/SettingsModal';
import { OnboardingModal } from './presentation/components/OnboardingModal';
import { UpdateBanner } from './presentation/components/UpdateBanner';
import { AchievementToast } from './presentation/components/AchievementToast';
import { Scratchpad } from './presentation/components/Scratchpad';

// Code-splitting: Lazy load content modules on demand
const BhaskaraModule = lazy(() =>
  import('./presentation/modules/BhaskaraModule').then((m) => ({ default: m.BhaskaraModule }))
);
const RegraDeTresModule = lazy(() =>
  import('./presentation/modules/RegraDeTresModule').then((m) => ({ default: m.RegraDeTresModule }))
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
  const activeTab = useAppStore((s) => s.activeTab);
  const theme = useAppStore((s) => s.settings.theme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Updater Toast Banner */}
      <UpdateBanner />

      {/* Achievement Toast with Confetti */}
      <AchievementToast />

      {/* Floating Scratchpad Board */}
      <Scratchpad />

      {/* Navigation Bar */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 md:pt-8 pb-36 md:pb-16">
        <Suspense fallback={<ModuleSkeleton />}>
          {activeTab === 'bhaskara' && <BhaskaraModule />}
          {(activeTab === 'regra_simples' || activeTab === 'regra_composta') && (
            <RegraDeTresModule />
          )}
          {activeTab === 'physics' && <PhysicsModule />}
          {activeTab === 'quiz' && <QuizModule />}
          {activeTab === 'history' && <HistoryModule />}
        </Suspense>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <OnboardingModal />
    </div>
  );
}

export default App;
