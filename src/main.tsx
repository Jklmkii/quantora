import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'
import { TrayPracticeWidget } from './presentation/components/TrayPracticeWidget'
import { useAppStore } from './store/useAppStore'

if (typeof window !== 'undefined') {
  (window as unknown as { __quantoraStore: typeof useAppStore }).__quantoraStore = useAppStore;
}

const isTrayPractice = window.location.hash === '#tray-practice';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTrayPractice ? <TrayPracticeWidget /> : <App />}
  </StrictMode>,
)

// Register PWA Service Worker for offline support (Web only - skip in Electron and native Capacitor)
if (
  'serviceWorker' in navigator &&
  import.meta.env.PROD &&
  !window.electronAPI &&
  !Capacitor.isNativePlatform()
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
      console.error('SW registration failed: ', err);
    });
  });
}
