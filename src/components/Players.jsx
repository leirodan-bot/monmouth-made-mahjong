import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier } from '../eloUtils'
import { BADGES, BADGE_CATEGORIES, getBadge } from '../badgeUtils'

function RankBadge({ elo }) {
  const tier = getTier(elo)
  return (
    <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'sans-serif', fontWeight: 600, background: tier.bg, color: tier.textColor }}>
      {tier.name}
    </span>
  )
}

export default function Players({ session, player }) {
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlayers() }, [])

  async function fetchPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
    setPlayers(data || [])
    setLoading(false)
  }

  async function fetchBadges(playerId) {
    const { data } = await supabase
      .from('player_badges')
      .select('badge_id, earned_at')
      .eq('player_id', playerId)
      .order('earned_at', { ascending: false })
    setBadges(data || [])
  }

  function selectPlayer(p) {
    setSelected(p)
    fetchBadges(p.id)
  }

  async function generateShareCard(p, earnedBadges) {
    const canvas = document.createElement('canvas')
    const w = 600, h = 400
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    // Load logo
    const logo = new Image()
    const logoModule = await import('../assets/logo-header.png')
    logo.src = logoModule.default

    await new Promise((resolve) => {
      logo.onload = resolve
      logo.onerror = resolve // continue even if logo fails
    })

    // Background
    ctx.fillStyle = '#1e2b65'
    ctx.fillRect(0, 0, w, h)

    // Card area
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(20, 20, w - 40, h - 40, 16)
    ctx.fill()

    // Header bar
    ctx.fillStyle = '#1e2b65'
    ctx.beginPath()
    ctx.roundRect(20, 20, w - 40, 70, [16, 16, 0, 0])
    ctx.fill()

    // Draw logo on header bar
    if (logo.complete && logo.naturalWidth > 0) {
      const logoH = 36
      const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH
      ctx.drawImage(logo, 40, 37, logoW, logoH)
    } else {
      // Fallback text if logo fails to load
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Georgia, serif'
      ctx.fillText('MONMOUTH MADE MAH JONGG', 40, 60)
    }

    // Player name
    ctx.fillStyle = '#1e2b65'
    ctx.font = 'bold 28px Georgia, serif'
    ctx.fillText(p.name, 40, 130)

    // Town
    ctx.fillStyle = '#888888'
    ctx.font = '14px sans-serif'
    ctx.fillText(`${p.town || 'Monmouth County'} · Season 1`, 40, 155)

    // Elo rating
    ctx.fillStyle = '#9f1239'
    ctx.font = 'bold 48px Georgia, serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(p.elo || 800), w - 40, 135)

    // Rank tier
    const tier = getTier(p.elo || 800)
    ctx.fillStyle = '#888888'
    ctx.font = '13px sans-serif'
    ctx.fillText(tier.name, w - 40, 158)
    ctx.textAlign = 'left'

    // Stats row
    const stats = [
      { label: 'WINS', value: String(p.wins || 0) },
      { label: 'LOSSES', value: String(p.losses || 0) },
      { label: 'GAMES', value: String(p.games_played || 0) },
      { label: 'WIN %', value: (p.games_played || 0) > 0 ? `${Math.round(((p.wins || 0) / p.games_played) * 100)}%` : '—' },
    ]
    const statW = (w - 80) / 4
    stats.forEach((s, i) => {
      const x = 40 + i * statW
      ctx.fillStyle = '#f4f4f2'
      ctx.beginPath()
      ctx.roundRect(x, 180, statW - 8, 60, 8)
      ctx.fill()
      ctx.fillStyle = '#888888'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(s.label, x + (statW - 8) / 2, 200)
      ctx.fillStyle = '#1e2b65'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(s.value, x + (statW - 8) / 2, 228)
    })
    ctx.textAlign = 'left'

    // Badges row
    if (earnedBadges.length > 0) {
      ctx.fillStyle = '#888888'
      ctx.font = '11px sans-serif'
      ctx.fillText(`AWARDS (${earnedBadges.length})`, 40, 272)

      const badgesToShow = earnedBadges.slice(0, 8)
      badgesToShow.forEach((b, i) => {
        const x = 40 + i * 66
        ctx.font = '22px sans-serif'
        ctx.fillText(b.emoji || '🏆', x, 300)
        ctx.fillStyle = '#1e2b65'
        ctx.font = '9px sans-serif'
        ctx.fillText(b.name || '', x, 316)
        ctx.fillStyle = '#888888'
      })
      if (earnedBadges.length > 8) {
        ctx.fillStyle = '#888888'
        ctx.font = '11px sans-serif'
        ctx.fillText(`+${earnedBadges.length - 8} more`, 40 + 8 * 66, 300)
      }
    }

    // Footer
    ctx.fillStyle = '#c8cdd6'
    ctx.font = '10px sans-serif'
    ctx.fillText('monmouthmademahjongg.com', 40, h - 36)

    // Streak
    if ((p.current_streak || 0) > 1) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ea580c'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(`🔥 ${p.current_streak} win streak`, w - 40, h - 36)
      ctx.textAlign = 'left'
    }

    // Generate image
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `${p.name.replace(/\s+/g, '-').toLowerCase()}-mmj.png`, { type: 'image/png' })

      // Try Web Share API first (works on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${p.name} — Monmouth Made Mah Jongg`,
            text: `Check out ${p.name}'s stats on Monmouth Made Mah Jongg!`,
            files: [file],
          })
          return
        } catch (e) {
          // User cancelled or share failed, fall through to download
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading players...</div>

  if (selected) {
    const earnedIds = badges.map(b => b.badge_id)
    const earnedBadges = badges.map(b => ({ ...getBadge(b.badge_id), earned_at: b.earned_at })).filter(b => b.id)

    return (
      <div>
        <button onClick={() => { setSelected(null); setBadges([]) }} style={{ background: 'none', border: '0.5px solid #c8cdd6', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: 'sans-serif', color: '#1e2b65', marginBottom: 16, cursor: 'pointer' }}>
          ← Back to players
        </button>
        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1e2b65', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4f4f2', fontSize: 20, fontWeight: 700 }}>
              {selected.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65' }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 2 }}>{selected.town} · {selected.org || 'Unaffiliated'}</div>
              <div style={{ marginTop: 6 }}><RankBadge elo={selected.elo} /></div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{selected.elo}</div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>Elo Rating</div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Wins', value: selected.wins || 0 },
              { label: 'Losses', value: selected.losses || 0 },
              { label: 'Games', value: selected.games_played || 0 },
              { label: 'Win %', value: (selected.games_played || 0) > 0 ? `${Math.round(((selected.wins || 0) / selected.games_played) * 100)}%` : '—' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f4f4f2', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {(selected.current_streak || 0) > 1 && (
            <div style={{ marginBottom: 16, background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'sans-serif', color: '#92400e' }}>
              🔥 Current win streak: {selected.current_streak} games
            </div>
          )}

          {/* === BADGES SECTION === */}
          <div style={{ borderTop: '0.5px solid #e8e8e4', paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65' }}>
                Awards <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>({earnedBadges.length}/{BADGES.length})</span>
              </div>
            </div>

            {earnedBadges.length > 0 ? (
              <div>
                {/* Earned badges by category */}
                {BADGE_CATEGORIES.map(cat => {
                  const catBadges = earnedBadges.filter(b => b.category === cat)
                  if (catBadges.length === 0) return null
                  return (
                    <div key={cat} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', fontFamily: 'sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>{cat.toUpperCase()}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {catBadges.map(b => (
                          <div key={b.id} title={`${b.name}: ${b.desc}\nEarned ${new Date(b.earned_at).toLocaleDateString()}`}
                            style={{
                              background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10,
                              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                              cursor: 'default'
                            }}>
                            <span style={{ fontSize: 20 }}>{b.emoji}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2b65' }}>{b.name}</div>
                              <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif' }}>{b.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Locked badges */}
                {(() => {
                  const lockedBadges = BADGES.filter(b => !earnedIds.includes(b.id))
                  if (lockedBadges.length === 0) return null
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', fontFamily: 'sans-serif', letterSpacing: '0.5px', marginBottom: 8 }}>LOCKED</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lockedBadges.map(b => (
                          <div key={b.id} title={`${b.name}: ${b.desc}`}
                            style={{
                              background: '#f4f4f2', border: '0.5px solid #e8e8e4', borderRadius: 8,
                              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                              opacity: 0.5, cursor: 'default'
                            }}>
                            <span style={{ fontSize: 16, filter: 'grayscale(1)' }}>{b.emoji}</span>
                            <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'sans-serif' }}>{b.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BADGES.map(b => (
                  <div key={b.id} title={`${b.name}: ${b.desc}`}
                    style={{
                      background: '#f4f4f2', border: '0.5px solid #e8e8e4', borderRadius: 8,
                      padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                      opacity: 0.5, cursor: 'default'
                    }}>
                    <span style={{ fontSize: 16, filter: 'grayscale(1)' }}>{b.emoji}</span>
                    <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'sans-serif' }}>{b.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: '#888', fontFamily: 'sans-serif' }}>
            Member since {new Date(selected.join_date || selected.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>

          {/* Share Card Button */}
          <button onClick={() => generateShareCard(selected, earnedBadges)} style={{
            marginTop: 16, width: '100%', padding: 11, borderRadius: 8,
            background: 'white', border: '0.5px solid #c8cdd6',
            fontSize: 13, fontFamily: 'sans-serif', fontWeight: 600, color: '#1e2b65', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            📤 Share Player Card
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65' }}>Player Directory</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>{players.length} registered players · Season 1</p>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {players.map((p, i) => (
          <div key={p.id} onClick={() => selectPlayer(p)} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#aaa', minWidth: 24 }}>{i + 1}</div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e2b65', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4f4f2', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {p.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65' }}>{p.name} {p.id === player?.id && <span style={{ fontSize: 10, background: '#eef1f8', color: '#1e2b65', padding: '1px 6px', borderRadius: 10, fontFamily: 'sans-serif' }}>You</span>}</div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginTop: 1 }}>{p.town} · {p.org || 'Unaffiliated'}</div>
            </div>
            <RankBadge elo={p.elo} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{(p.elo || 800).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif' }}>{p.wins || 0}W–{p.losses || 0}L</div>
            </div>
            {(p.current_streak || 0) > 1 && <div style={{ fontSize: 11, fontFamily: 'sans-serif' }}>🔥{p.current_streak}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
