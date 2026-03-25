import { useState } from 'react'
import { getKFactor } from '../eloUtils'

const C = {
  jade: '#065F46', jadeLt: '#059669',
  crimson: '#DC2626', crimsonLt: '#EF4444',
  gold: '#F59E0B', goldDk: '#D97706',
  midnight: '#0F172A', ink: '#1E293B',
  cloud: '#F8FAFC', white: '#FFFFFF',
  slate: '#64748B', slateLt: '#94A3B8',
  border: '#E2E8F0',
}

export default function EloCalculator({ dark = false }) {
  const [myElo, setMyElo] = useState(800)
  const [oppElo, setOppElo] = useState(800)
  const [myGames, setMyGames] = useState(0)

  const D = 40
  const k = getKFactor(myGames)
  const gapAdj = (oppElo - myElo) / D
  const winGain = Math.round(k * (30 + gapAdj) * 10) / 10
  const lossLoss = Math.round(Math.abs(k * (-10 + gapAdj)) * 10) / 10

  const textColor = dark ? C.white : C.midnight
  const subColor = dark ? 'rgba(255,255,255,0.5)' : C.slateLt
  const sliderBg = dark ? 'rgba(255,255,255,0.1)' : C.cloud

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: subColor, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Your Elo</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: textColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{myElo}</div>
          <input type="range" min="500" max="1400" value={myElo} onChange={e => setMyElo(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: subColor, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Opponent Elo</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: textColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{oppElo}</div>
          <input type="range" min="500" max="1400" value={oppElo} onChange={e => setOppElo(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: subColor, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Games Played</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: textColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{myGames}</div>
          <input type="range" min="0" max="200" value={myGames} onChange={e => setMyGames(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: dark ? 'rgba(6,95,70,0.15)' : 'rgba(6,95,70,0.06)',
          border: `1px solid ${dark ? 'rgba(6,95,70,0.3)' : 'rgba(6,95,70,0.15)'}`,
          borderRadius: 12, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: C.jadeLt, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 4 }}>If you WIN</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.jadeLt, fontFamily: "'JetBrains Mono', monospace" }}>+{winGain}</div>
        </div>
        <div style={{
          background: dark ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.04)',
          border: `1px solid ${dark ? 'rgba(220,38,38,0.3)' : 'rgba(220,38,38,0.15)'}`,
          borderRadius: 12, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: C.crimsonLt, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 4 }}>If you LOSE</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.crimsonLt, fontFamily: "'JetBrains Mono', monospace" }}>-{lossLoss}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: subColor, fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>
        K-factor: {k.toFixed(2)} · Gap adjustment: {gapAdj > 0 ? '+' : ''}{gapAdj.toFixed(1)}
      </div>
    </div>
  )
}
