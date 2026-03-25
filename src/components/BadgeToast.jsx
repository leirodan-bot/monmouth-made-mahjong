import { useState, useEffect } from 'react'

const C = {
  gold: '#F59E0B', goldDk: '#D97706', goldPale: '#FFFBEB',
  midnight: '#0F172A', slate: '#64748B', white: '#FFFFFF',
}

export default function BadgeToast({ badge, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!badge) return
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss?.(), 500)
    }, 4000)
    return () => clearTimeout(timer)
  }, [badge])

  if (!badge) return null

  return (
    <div style={{
      position: 'fixed', top: 40, left: 16, right: 16, zIndex: 100,
      background: C.white, borderRadius: 14,
      borderLeft: `4px solid ${C.gold}`,
      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>{badge.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>{badge.name}</div>
        <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{badge.desc}</div>
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 300) }} style={{
        background: C.goldPale, border: 'none', borderRadius: 8,
        padding: '6px 12px', fontSize: 11, fontWeight: 600,
        color: C.goldDk, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', flexShrink: 0,
      }}>Share</button>
    </div>
  )
}
