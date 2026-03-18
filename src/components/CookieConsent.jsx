import { useState, useEffect } from 'react'

export default function CookieConsent({ setTab }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('mmj_cookie_consent')
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem('mmj_cookie_consent', 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('mmj_cookie_consent', 'essential_only')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1e2b65', borderTop: '2px solid #9f1239',
      padding: '16px 20px',
      animation: 'slideUp 0.4s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12.5, fontFamily: 'sans-serif', color: '#d0d8e8', lineHeight: 1.6, flex: 1, minWidth: 280 }}>
          We use cookies to keep you logged in and improve your experience. Analytics cookies help us understand how the Platform is used.{' '}
          <span
            onClick={() => { setTab('cookies'); setVisible(false) }}
            style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          >
            Learn more
          </span>
        </p>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={decline}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 6, padding: '8px 16px', color: '#d0d8e8',
              fontSize: 12, fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Essential Only
          </button>
          <button
            onClick={accept}
            style={{
              background: '#9f1239', border: 'none', borderRadius: 6,
              padding: '8px 20px', color: '#fff', fontSize: 12,
              fontFamily: 'sans-serif', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}