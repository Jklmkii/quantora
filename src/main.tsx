import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TrayPracticeWidget } from './presentation/components/TrayPracticeWidget'

const isTrayPractice = window.location.hash === '#tray-practice';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTrayPractice ? <TrayPracticeWidget /> : <App />}
  </StrictMode>,
)

// Register PWA Service Worker for offline support (Web only - skip in Electron to prevent file:// protocol error)
if ('serviceWorker' in navigator && import.meta.env.PROD && !window.electronAPI) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('SW registration failed: ', err);
    });
  });
}
