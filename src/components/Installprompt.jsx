import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently (don't nag — show again after 7 days)
    const dismissed = localStorage.getItem('mmj-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return
    }

    // Detect iOS (no beforeinstallprompt on Safari)
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
    setIsIOS(isiOS)

    if (isiOS) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android / Chrome — capture the install prompt
    function handleBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowBanner(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShowBanner(false)
    localStorage.setItem('mmj-install-dismissed', new Date().toISOString())
  }

  if (isInstalled || !showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      padding: '0 16px 16px',
      animation: 'mmj-slideUp 0.4s ease-out',
    }}>
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        background: '#1e2b65',
        borderRadius: 16,
        padding: '20px',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* App icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/icon-192.png" alt="" style={{ width: 48, height: 48, borderRadius: 10 }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4,
          }}>
            Add to Home Screen
          </div>
          {isIOS ? (
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', lineHeight: 1.5,
            }}>
              Tap <span style={{
                display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle',
                background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px',
                fontSize: 14,
              }}>⎙</span> then <strong style={{ color: 'rgba(255,255,255,0.85)' }}>"Add to Home Screen"</strong>
            </div>
          ) : (
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', lineHeight: 1.5,
            }}>
              Install the app for quick access — no app store needed.
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {!isIOS && (
            <button
              onClick={handleInstall}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: '#C4A35A', color: '#111D33',
                fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              fontFamily: 'sans-serif', fontSize: 11, cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Not now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes mmj-slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}