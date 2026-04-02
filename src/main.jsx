import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA (skip on native Capacitor — it handles caching differently)
const isCapacitor = window.Capacitor?.isNativePlatform?.()
if ('serviceWorker' in navigator && !isCapacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        // Check for updates hourly
        setInterval(() => reg.update(), 60 * 60 * 1000)
      })
      .catch((err) => console.log('SW registration failed:', err))
  })
}
