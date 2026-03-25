import { useState, useEffect } from 'react'

const C = {
  jade: '#065F46', gold: '#F59E0B', midnight: '#0F172A',
  white: '#FFFFFF', slate: '#64748B',
}

const TIER_EMOJIS = {
  Novice: '🀆', Beginner: '🌸', Skilled: '🎋',
  Expert: '🐲', Master: '🐉', Grandmaster: '🐉🐲',
}

export default function TierPromotion({ tier, onDismiss }) {
  const [phase, setPhase] = useState(0) // 0=entering, 1=visible, 2=exiting
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!tier) return
    requestAnimationFrame(() => setPhase(1))

    // Generate confetti particles
    const colors = [tier.color, C.gold, C.jade, '#EF4444', '#8B5CF6']
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
    })))

    const timer = setTimeout(() => {
      setPhase(2)
      setTimeout(() => onDismiss?.(), 500)
    }, 4000)
    return () => clearTimeout(timer)
  }, [tier])

  if (!tier) return null

  const emoji = TIER_EMOJIS[tier.name] || '🏆'

  return (
    <div onClick={() => { setPhase(2); setTimeout(() => onDismiss?.(), 300) }} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase >= 1 ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Confetti */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -10,
          left: `${p.x}%`,
          width: p.size, height: p.size, borderRadius: 2,
          background: p.color,
          animation: `confetti-fall ${p.duration}s ease-in ${p.delay + 0.5}s both`,
        }} />
      ))}

      {/* Badge emoji */}
      <div style={{
        fontSize: 64, marginBottom: 16,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0)',
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
      }}>{emoji}</div>

      {/* Tier name */}
      <div style={{
        fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 800,
        color: tier.color === C.midnight ? C.gold : tier.color,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.7)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s',
      }}>{tier.name}</div>

      {/* Subtitle */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.5s ease 0.6s',
      }}>You reached {tier.name} tier · Elo {tier.min}+</div>

      {/* Tap to dismiss */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)',
        marginTop: 24,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.5s ease 0.8s',
      }}>Tap to dismiss</div>

      <style>{`
        @keyframes confetti-fall {
          from { transform: translateY(0) rotate(0deg); opacity: 1; }
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
