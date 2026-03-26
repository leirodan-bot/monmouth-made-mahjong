import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier } from '../eloUtils'
import { BADGES, BADGE_CATEGORIES, getBadge } from '../badgeUtils'
import { C, fonts, shadows } from '../theme'
import useFriends from '../useFriends'

function RankBadge({ elo }) {
  const tier = getTier(elo)
  return <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: tier.bg, color: tier.textColor }}>{tier.name}</span>
}

export default function Players({ session, player, initialPlayerId, onClearInitial, searchFilter = '' }) {
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  const [h2h, setH2h] = useState(null)

  useEffect(() => { fetchPlayers() }, [])
  useEffect(() => {
    if (initialPlayerId && players.length > 0 && !selected) {
      const p = players.find(pl => pl.id === initialPlayerId)
      if (p) { selectPlayer(p); if (onClearInitial) onClearInitial() }
    }
  }, [initialPlayerId, players])
  async function fetchPlayers() { const { data } = await supabase.from('players').select('*').order('elo', { ascending: false }); setPlayers(data || []); setLoading(false) }
  async function fetchBadges(playerId) { const { data } = await supabase.from('player_badges').select('badge_id, earned_at').eq('player_id', playerId).order('earned_at', { ascending: false }); setBadges(data || []) }
  async function fetchH2H(targetId) {
    if (!player?.id || targetId === player.id) { setH2h(null); return }
    const { data } = await supabase.rpc('get_head_to_head', { p_player_id: player.id })
    if (data) {
      const record = data.find(r => r.opponent_id === targetId)
      setH2h(record || null)
    } else { setH2h(null) }
  }
  function selectPlayer(p) { setSelected(p); fetchBadges(p.id); fetchH2H(p.id) }

  // Friends system
  const { friendIds, getStatus, sendRequest, removeFriend } = useFriends(player?.id, player?.name)

  function handleFriendAction(e, targetId) {
    e.stopPropagation()
    if (!player?.id || targetId === player.id) return
    const status = getStatus(targetId)
    if (status === 'none') sendRequest(targetId)
    else if (status === 'friends') removeFriend(targetId)
    // 'sent' and 'pending' — no action on click (show label only)
  }

  async function generateShareCard(p, earnedBadges) {
    const canvas = document.createElement('canvas')
    const w = 600, h = 400, scale = 2
    canvas.width = w * scale; canvas.height = h * scale; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d'); ctx.scale(scale, scale)
    const logo = new Image(); const logoModule = await import('../assets/mahjrank/mahjranklogomonowhite1800.png')
    logo.src = logoModule.default; await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve })
    ctx.fillStyle = C.midnight; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(20, 20, w - 40, h - 40, 16); ctx.fill()
    ctx.fillStyle = C.midnight; ctx.beginPath(); ctx.roundRect(20, 20, w - 40, 70, [16, 16, 0, 0]); ctx.fill()
    if (logo.complete && logo.naturalWidth > 0) { const logoH = 30; const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH; ctx.drawImage(logo, 40, 40, logoW, logoH) }
    else { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('MahjRank', 40, 60) }
    ctx.fillStyle = C.midnight; ctx.font = 'bold 28px sans-serif'; ctx.fillText(p.name, 40, 130)
    ctx.fillStyle = C.slate; ctx.font = '14px sans-serif'; ctx.fillText(`${p.town || ''} · Season 1`.replace(/^ · /, 'Season 1'), 40, 155)
    ctx.fillStyle = C.crimson; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(String(Math.round(p.elo || 800)), w - 40, 135)
    const tier = getTier(p.elo || 800); ctx.fillStyle = C.slate; ctx.font = '13px sans-serif'; ctx.fillText(tier.name, w - 40, 158); ctx.textAlign = 'left'
    const stats = [{ label: 'WINS', value: String(p.wins || 0) }, { label: 'LOSSES', value: String(p.losses || 0) }, { label: 'GAMES', value: String(p.games_played || 0) }, { label: 'WIN %', value: (p.games_played || 0) > 0 ? `${Math.round(((p.wins || 0) / p.games_played) * 100)}%` : '—' }]
    const statW = (w - 80) / 4
    stats.forEach((s, i) => { const x = 40 + i * statW; ctx.fillStyle = C.cloud; ctx.beginPath(); ctx.roundRect(x, 180, statW - 8, 60, 8); ctx.fill(); ctx.fillStyle = C.slate; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.label, x + (statW - 8) / 2, 200); ctx.fillStyle = C.midnight; ctx.font = 'bold 20px sans-serif'; ctx.fillText(s.value, x + (statW - 8) / 2, 228) }); ctx.textAlign = 'left'
    if (earnedBadges.length > 0) { ctx.fillStyle = C.slate; ctx.font = '11px sans-serif'; ctx.fillText(`AWARDS (${earnedBadges.length})`, 40, 272); const badgesToShow = earnedBadges.slice(0, 8); badgesToShow.forEach((b, i) => { const x = 40 + i * 66; ctx.font = '22px sans-serif'; ctx.fillText(b.emoji || '🏆', x, 300); ctx.fillStyle = C.midnight; ctx.font = '9px sans-serif'; ctx.fillText(b.name || '', x, 316); ctx.fillStyle = C.slate }); if (earnedBadges.length > 8) { ctx.fillStyle = C.slate; ctx.font = '11px sans-serif'; ctx.fillText(`+${earnedBadges.length - 8} more`, 40 + 8 * 66, 300) } }
    ctx.fillStyle = C.slateMd; ctx.font = '10px sans-serif'; ctx.fillText('mahjrank.com', 40, h - 36)
    if ((p.current_streak || 0) > 1) { ctx.textAlign = 'right'; ctx.fillStyle = '#ea580c'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`🔥 ${p.current_streak} win streak`, w - 40, h - 36); ctx.textAlign = 'left' }
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `${p.name.replace(/\s+/g, '-').toLowerCase()}-mahjrank.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ title: `${p.name} — MahjRank`, text: `Check out ${p.name}'s stats on MahjRank!`, files: [file] }); return } catch (e) {} }
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url)
    }, 'image/png')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: C.slate }}>Loading players...</div>

  if (selected) {
    const earnedIds = badges.map(b => b.badge_id)
    const earnedBadges = badges.map(b => ({ ...getBadge(b.badge_id), earned_at: b.earned_at })).filter(b => b.id)
    return (
      <div>
        <button onClick={() => { setSelected(null); setBadges([]); setH2h(null) }} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.midnight, marginBottom: 16, cursor: 'pointer' }}>← Back to players</button>
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.jade, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: selected.avatar ? 26 : 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{selected.avatar || selected.name.split(' ').map(n => n[0]).join('')}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{selected.town || 'No town set'}</div>
              <div style={{ marginTop: 6 }}><RankBadge elo={selected.elo} /></div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(selected.elo || 800)}</div>
              <div style={{ fontSize: 11, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>Elo Rating</div>
              {player && selected.id !== player.id && (() => {
                const status = getStatus(selected.id)
                const labels = { none: '+ Add Friend', sent: 'Request Sent', pending: 'Accept Request', friends: 'Friends ✓' }
                const isFriend = status === 'friends'
                const isSent = status === 'sent'
                return (
                  <button onClick={(e) => handleFriendAction(e, selected.id)} style={{
                    marginTop: 8, padding: '8px 20px', borderRadius: 12, fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                    cursor: isSent ? 'default' : 'pointer',
                    background: isFriend ? C.jade : isSent ? C.cloud : 'white',
                    color: isFriend ? 'white' : isSent ? C.slate : C.jade,
                    border: isFriend ? 'none' : isSent ? `1px solid ${C.border}` : `1.5px solid ${C.jade}`,
                  }}>{labels[status] || '+ Add Friend'}</button>
                )
              })()}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[{ label: 'Wins', value: selected.wins || 0 }, { label: 'Losses', value: selected.losses || 0 }, { label: 'Games', value: selected.games_played || 0 }, { label: 'Win %', value: (selected.games_played || 0) > 0 ? `${Math.round(((selected.wins || 0) / selected.games_played) * 100)}%` : '—' }].map(s => (
              <div key={s.label} style={{ background: C.cloud, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.slateMd, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.midnight, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>
          {(selected.current_streak || 0) > 1 && <div style={{ marginBottom: 16, background: 'rgba(245,158,11,0.05)', border: `1px solid rgba(245,158,11,0.15)`, borderLeft: `4px solid ${C.gold}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: C.goldDk }}>🔥 Current win streak: {selected.current_streak} games</div>}
          {h2h && h2h.games_together > 0 && selected.id !== player?.id && (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.crimson}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>You vs. {selected.name}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.jade, fontFamily: "'JetBrains Mono', monospace" }}>{h2h.my_wins}</div>
                  <div style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>Your Wins</div>
                </div>
                <div style={{ fontSize: 14, color: C.slateMd, fontWeight: 700 }}>—</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{h2h.their_wins}</div>
                  <div style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>Their Wins</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>
                {h2h.games_together} games together{h2h.wall_games > 0 ? ` · ${h2h.wall_games} wall` : ''}
              </div>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>Awards <span style={{ fontSize: 12, fontWeight: 400, color: C.slateMd }}>({earnedBadges.length}/{BADGES.length})</span></div>
            </div>
            {earnedBadges.length > 0 ? (
              <div>
                {BADGE_CATEGORIES.map(cat => {
                  const catBadges = earnedBadges.filter(b => b.category === cat); if (catBadges.length === 0) return null
                  return (
                    <div key={cat} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.slateMd, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: 8 }}>{cat.toUpperCase()}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {catBadges.map(b => (
                          <div key={b.id} title={`${b.name}: ${b.desc}\nEarned ${new Date(b.earned_at).toLocaleDateString()}`} style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>{b.emoji}</span>
                            <div><div style={{ fontSize: 12, fontWeight: 700, color: C.midnight }}>{b.name}</div><div style={{ fontSize: 10, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{b.desc}</div></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {(() => {
                  const lockedBadges = BADGES.filter(b => !earnedIds.includes(b.id)); if (lockedBadges.length === 0) return null
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.slateMd, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: 8 }}>LOCKED</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lockedBadges.map(b => (
                          <div key={b.id} title={`${b.name}: ${b.desc}`} style={{ background: C.cloud, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5 }}>
                            <span style={{ fontSize: 16, filter: 'grayscale(1)' }}>{b.emoji}</span>
                            <div style={{ fontSize: 11, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>{b.name}</div>
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
                  <div key={b.id} title={`${b.name}: ${b.desc}`} style={{ background: C.cloud, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5 }}>
                    <span style={{ fontSize: 16, filter: 'grayscale(1)' }}>{b.emoji}</span>
                    <div style={{ fontSize: 11, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>{b.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>Member since {new Date(selected.join_date || selected.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => generateShareCard(selected, earnedBadges)} style={{ marginTop: 16, width: '100%', padding: 11, borderRadius: 8, background: 'white', border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: C.midnight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>📤 Share Player Card</button>
        </div>
      </div>
    )
  }

  const filteredPlayers = searchFilter
    ? players.filter(p =>
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.town && p.town.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : players

  return (
    <div>
      {!searchFilter && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Player Directory</h2>
          <p style={{ fontSize: 12, color: C.slate, fontFamily: "'JetBrains Mono', monospace", marginTop: 4, letterSpacing: 0.3 }}>{players.length} players · Season 1</p>
        </div>
      )}
      {searchFilter && filteredPlayers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: C.slate, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          No players found for "{searchFilter}"
        </div>
      )}
      <div style={{ display: 'grid', gap: 8 }}>
        {filteredPlayers.map((p, i) => (
          <div key={p.id} onClick={() => selectPlayer(p)} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.slateMd, minWidth: 24, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.jade, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: p.avatar ? 18 : 11, fontWeight: 700, flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>{p.avatar || p.name.split(' ').map(n => n[0]).join('')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>{p.name} {p.id === player?.id && <span style={{ fontSize: 10, background: 'rgba(22,101,52,0.06)', color: C.jade, padding: '1px 6px', borderRadius: 6, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>You</span>}</div>
              <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{p.town || '—'}</div>
            </div>
            <RankBadge elo={p.elo} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(p.elo || 800)}</div>
              <div style={{ fontSize: 10, color: C.slateMd, fontFamily: "'DM Sans', sans-serif" }}>{p.wins || 0}W–{p.losses || 0}L</div>
            </div>
            {(p.current_streak || 0) > 1 && <div style={{ fontSize: 11 }}>🔥{p.current_streak}</div>}
            {/* Friend button — right side of card */}
            {player && p.id !== player.id && (() => {
              const status = getStatus(p.id)
              const isFriend = status === 'friends'
              const isSent = status === 'sent'
              const isPending = status === 'pending'
              const label = isFriend ? '👋' : isSent ? '⏳' : isPending ? '✓' : '+'
              const title = isFriend ? 'Friends' : isSent ? 'Request sent' : isPending ? 'Accept request' : 'Add friend'
              return (
                <button onClick={(e) => handleFriendAction(e, p.id)} title={title} style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 10, fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  cursor: isSent ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isFriend ? 'rgba(22,101,52,0.06)' : isPending ? 'rgba(22,101,52,0.06)' : 'white',
                  color: isFriend ? C.jade : isPending ? C.jade : isSent ? C.slate : C.jade,
                  border: isFriend ? `1.5px solid ${C.jade}` : isPending ? `1.5px solid ${C.jade}` : isSent ? `1px solid ${C.border}` : `1.5px solid ${C.jade}`,
                }}>{label}</button>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}