import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier } from '../eloUtils'
import { BADGES, BADGE_CATEGORIES } from '../badgeUtils'

const C = {
  jade: '#065F46', jadeLt: '#059669', crimson: '#DC2626',
  gold: '#F59E0B', goldDk: '#D97706', midnight: '#0F172A',
  ink: '#1E293B', cloud: '#EDF0F4', slate: '#64748B',
  slateLt: '#94A3B8', border: '#E2E8F0', cloudLt: '#FFFFFF',
}

import noviceBadge from '../assets/badges/novice.png'
import beginnerBadge from '../assets/badges/beginner.png'
import skilledBadge from '../assets/badges/skilled.png'
import expertBadge from '../assets/badges/expert.png'
import masterBadge from '../assets/badges/master.png'
import grandmasterBadge from '../assets/badges/grandmaster.png'

const TIER_IMAGES = { Novice: noviceBadge, Beginner: beginnerBadge, Skilled: skilledBadge, Expert: expertBadge, Master: masterBadge, Grandmaster: grandmasterBadge }

function TierBadge({ elo }) {
  const tier = getTier(elo)
  const img = TIER_IMAGES[tier.name]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {img && <img src={img} alt={tier.name} style={{ width: 36, height: 48, borderRadius: 4 }} />}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: tier.bg, color: tier.textColor,
        padding: '4px 12px', borderRadius: 20,
        fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
      }}>
        {tier.name}
      </span>
    </div>
  )
}

function EloSparkline({ history }) {
  if (!history || history.length < 2) return null
  const ratings = history.map(h => h.rating_after)
  const min = Math.min(...ratings) - 5
  const max = Math.max(...ratings) + 5
  const range = max - min || 1
  const w = 280, h = 60, pad = 2

  const points = ratings.map((r, i) => {
    const x = pad + (i / (ratings.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (r - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const lastRating = ratings[ratings.length - 1]
  const firstRating = ratings[0]
  const color = lastRating >= firstRating ? C.jade : C.crimson

  return (
    <div style={{ textAlign: 'center', marginTop: 4 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: '100%' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points.split(' ').pop().split(',')[0]} cy={points.split(' ').pop().split(',')[1]} r="3" fill={color} />
      </svg>
      <div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
        Last {history.length} games
      </div>
    </div>
  )
}

export default function ProfileSection({ session, player, onSignOut, setTab }) {
  const [earnedBadges, setEarnedBadges] = useState([])
  const [rivals, setRivals] = useState([])
  const [eloHistory, setEloHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [followedIds, setFollowedIdsLocal] = useState([])

  useEffect(() => {
    if (!player?.id) return
    loadProfileData()
  }, [player?.id])

  async function loadProfileData() {
    setLoading(true)

    // Fetch earned badges
    const { data: badges } = await supabase
      .from('player_badges')
      .select('badge_id, earned_at, game_id')
      .eq('player_id', player.id)
      .order('earned_at', { ascending: true })

    if (badges) setEarnedBadges(badges)

    // Fetch head-to-head rivals
    const { data: h2h } = await supabase.rpc('get_head_to_head', { p_player_id: player.id })
    if (h2h) {
      const opponentIds = h2h.map(r => r.opponent_id)
      const { data: opponentData } = await supabase.from('players').select('id, name, elo, elo_rank_tier').in('id', opponentIds)
      const enriched = h2h.map(r => ({ ...r, ...(opponentData?.find(p => p.id === r.opponent_id) || {}) }))
      setRivals(enriched)
    }

    // Fetch Elo history (last 30 games)
    const { data: history } = await supabase
      .from('elo_history')
      .select('rating_before, rating_after, rating_change, k_factor, created_at')
      .eq('player_id', player.id)
      .order('created_at', { ascending: true })
      .limit(30)

    if (history) setEloHistory(history)

    // Fetch "People you play with" suggestions — players with 3+ shared games not yet followed
    const { data: followData } = await supabase.from('follows').select('following_id').eq('follower_id', player.id)
    const followIds = (followData || []).map(f => f.following_id)
    setFollowedIdsLocal(followIds)

    if (h2h) {
      const unfollowed = h2h
        .filter(r => r.games_together >= 3 && !followIds.includes(r.opponent_id))
        .sort((a, b) => b.games_together - a.games_together)
        .slice(0, 5)
      if (unfollowed.length > 0) {
        const ids = unfollowed.map(r => r.opponent_id)
        const { data: pData } = await supabase.from('players').select('id, name, elo').in('id', ids)
        setSuggestions(unfollowed.map(r => ({ ...r, ...(pData?.find(p => p.id === r.opponent_id) || {}) })))
      }
    }

    setLoading(false)
  }

  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  useEffect(() => {
    if (!player?.id) return
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', player.id)
      .then(({ count }) => setFollowerCount(count || 0))
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', player.id)
      .then(({ count }) => setFollowingCount(count || 0))
  }, [player?.id])
  const earnedIds = earnedBadges.map(b => b.badge_id)
  const gamesPlayed = player?.games_played || 0
  const winRate = gamesPlayed > 0 ? Math.round(((player?.wins || 0) / gamesPlayed) * 100) : 0

  return (
    <div>
      {/* ── Header Card ── */}
      <div style={{
        background: 'white',
        borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${C.jade}`,
        borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginBottom: 16,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: C.jade, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: '0 auto 12px' }}>
          {player?.name ? player.name.split(' ').map(n => n[0]).join('') : '?'}
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: C.midnight }}>{player?.name || 'Player'}</div>
        <div style={{ marginTop: 8 }}><TierBadge elo={player?.elo || 800} /></div>

        {/* Follow counts */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.midnight, fontFamily: "'JetBrains Mono', monospace" }}>{followerCount}</div>
            <div style={{ fontSize: 10, color: C.slate, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: 0.5 }}>Followers</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.midnight, fontFamily: "'JetBrains Mono', monospace" }}>{followingCount}</div>
            <div style={{ fontSize: 10, color: C.slate, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: 0.5 }}>Following</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {[
            { label: 'Elo', value: Math.round(player?.elo || 800), color: C.crimson },
            { label: 'Wins', value: player?.wins || 0, color: C.jade },
            { label: 'Losses', value: player?.losses || 0, color: C.ink },
            { label: 'Win %', value: `${winRate}%`, color: C.gold },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.cloudLt,
              borderTop: `3px solid ${s.color}`,
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Elo Sparkline */}
        <EloSparkline history={eloHistory} />
        <button onClick={() => generateShareCard(player, earnedBadges)} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 10, background: C.midnight, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share My Card
        </button>
      </div>

      {/* ── Badges Card ── */}
      <div style={{
        background: 'white',
        borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${C.gold}`,
        borderRadius: 16, padding: '20px', marginBottom: 16,
      }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>
          Badges
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.slateLt, marginLeft: 8 }}>
            {earnedIds.length}/{BADGES.length}
          </span>
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: C.slateLt, padding: '20px 0', textAlign: 'center' }}>Loading badges...</div>
        ) : (
          <>
            {/* Earned badges by category */}
            {BADGE_CATEGORIES.map(cat => {
              const catBadges = BADGES.filter(b => b.category === cat)
              const earned = catBadges.filter(b => earnedIds.includes(b.id))
              const locked = catBadges.filter(b => !earnedIds.includes(b.id))
              if (earned.length === 0 && locked.length === 0) return null

              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.slateLt, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginBottom: 6 }}>
                    {cat.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {earned.map(b => {
                      const eb = earnedBadges.find(e => e.badge_id === b.id)
                      return (
                        <div key={b.id} title={`${b.name}: ${b.desc}\nEarned ${eb ? new Date(eb.earned_at).toLocaleDateString() : ''}`} style={{
                          background: 'white', border: `1px solid ${C.border}`,
                          borderLeft: `3px solid ${C.gold}`,
                          borderRadius: 10, padding: '6px 10px',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <span style={{ fontSize: 18 }}>{b.emoji}</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.midnight }}>{b.name}</div>
                            <div style={{ fontSize: 9, color: C.slate }}>{b.desc}</div>
                          </div>
                        </div>
                      )
                    })}
                    {locked.map(b => (
                      <div key={b.id} title={b.desc} style={{
                        background: C.cloudLt, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: '6px 10px',
                        display: 'flex', alignItems: 'center', gap: 6, opacity: 0.45,
                      }}>
                        <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{b.emoji}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.slateLt }}>{b.name}</div>
                          <div style={{ fontSize: 9, color: C.slateLt }}>{b.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ── My Rivals ── */}
      {rivals.length > 0 && (
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.crimson}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 14 }}>My Rivals</div>
          {rivals.slice(0, 5).map(r => {
            const nonWallGames = r.games_together - (r.wall_games || 0)
            const theirWinPct = nonWallGames >= 5 ? r.their_wins / nonWallGames : 0
            const myWinPct = nonWallGames >= 5 ? r.my_wins / nonWallGames : 0
            const label = nonWallGames >= 5 && theirWinPct > 0.6 ? { text: 'Your Nemesis', emoji: '😈', color: C.crimson }
              : nonWallGames >= 5 && myWinPct > 0.6 ? { text: 'Your Pigeon', emoji: '🕊️', color: C.jade }
              : null
            return (
            <div key={r.opponent_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.midnight, fontFamily: "'DM Sans', sans-serif" }}>{r.name || 'Unknown'}</div>
                  {label && <span style={{ fontSize: 10, fontWeight: 700, color: label.color, fontFamily: "'DM Sans', sans-serif" }}>{label.emoji} {label.text}</span>}
                </div>
                <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{r.games_together} games together</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.jade, fontFamily: "'JetBrains Mono', monospace" }}>{r.my_wins}</div>
                  <div style={{ fontSize: 9, color: C.slate, textTransform: 'uppercase' }}>W</div>
                </div>
                <div style={{ fontSize: 12, color: C.slateLt }}>—</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{r.their_wins}</div>
                  <div style={{ fontSize: 9, color: C.slate, textTransform: 'uppercase' }}>L</div>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* ── People You Play With ── */}
      {suggestions.length > 0 && (
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.jadeLt}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 14 }}>People You Play With</div>
          <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Players you've shared 3+ games with</div>
          {suggestions.map(s => (
            <div key={s.opponent_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.midnight, fontFamily: "'DM Sans', sans-serif" }}>{s.name || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{s.games_together} games together</div>
              </div>
              <button onClick={async () => {
                await supabase.from('follows').insert({ follower_id: player.id, following_id: s.opponent_id })
                setSuggestions(prev => prev.filter(p => p.opponent_id !== s.opponent_id))
              }} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 11,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
                background: 'white', color: C.jade, border: `1px solid ${C.jade}`,
              }}>Follow</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Links ── */}
      {[
        { label: 'My Clubs', tab: 'clubs', accent: C.jade },
        { label: 'How It Works', tab: 'howitworks', accent: C.jadeLt },
        { label: 'Terms of Service', tab: 'terms', accent: C.slateLt },
        { label: 'Privacy Policy', tab: 'privacy', accent: C.slateLt },
      ].map((link, i) => (
        <button key={i} onClick={() => setTab(link.tab)} style={{
          width: '100%', background: 'white',
          borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${link.accent}`,
          borderRadius: 10, padding: '14px 16px', marginBottom: 6,
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.midnight,
          textAlign: 'left', fontWeight: 600, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {link.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.slateLt} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      ))}

      {/* Sign out */}
      <button onClick={onSignOut} style={{
        width: '100%', background: 'white',
        borderTop: '1px solid rgba(220,38,38,0.2)', borderRight: '1px solid rgba(220,38,38,0.2)',
        borderBottom: '1px solid rgba(220,38,38,0.2)', borderLeft: `4px solid ${C.crimson}`,
        borderRadius: 10, padding: '14px 16px', marginTop: 8,
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.crimson,
        textAlign: 'center', fontWeight: 600, cursor: 'pointer',
      }}>Sign Out</button>


    </div>
  )
}

// ── Share Card Generator ──
async function generateShareCard(player, earnedBadges) {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Load tier badge image ──
  const tier = getTier(player.elo || 800)
  const tierKey = tier.name.toLowerCase()
  let tierImg = null
  try {
    const tierMod = await import(`../assets/badges/${tierKey}.png`)
    tierImg = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = tierMod.default
    })
  } catch (e) { /* no tier image available */ }

  // ── White background ──
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Top jade bar
  ctx.fillStyle = '#065F46'
  ctx.fillRect(0, 0, W, 6)

  // ── LOGO ──
  ctx.textBaseline = 'top'
  ctx.font = '800 48px Outfit, sans-serif'
  const mahjW = ctx.measureText('Mahj').width
  const rankW = ctx.measureText('Rank').width
  const totalLogoW = mahjW + rankW
  const logoX = W / 2 - totalLogoW / 2
  ctx.fillStyle = '#065F46'
  ctx.textAlign = 'left'
  ctx.fillText('Mahj', logoX, 40)
  ctx.fillStyle = '#DC2626'
  ctx.fillText('Rank', logoX + mahjW, 40)

  // ── Player initials circle ──
  const initials = player.name ? player.name.split(' ').map(n => n[0]).join('') : '?'
  ctx.fillStyle = '#065F46'
  ctx.beginPath()
  ctx.roundRect(W/2 - 44, 120, 88, 88, 22)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 36px Outfit, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, W/2, 164)

  // ── Player name ──
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#0F172A'
  ctx.font = '700 48px Outfit, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(player.name || 'Player', W/2, 228)

  // ── Tier badge image + pill ──
  const tierY = 295
  if (tierImg) {
    const imgW = 80, imgH = 110
    ctx.drawImage(tierImg, W/2 - imgW/2, tierY, imgW, imgH)
    // Tier name below image
    ctx.font = '700 20px "DM Sans", sans-serif'
    ctx.fillStyle = tier.bg
    const pillW = ctx.measureText(tier.name.toUpperCase()).width + 48
    ctx.beginPath()
    ctx.roundRect(W/2 - pillW/2, tierY + imgH + 10, pillW, 36, 18)
    ctx.fill()
    ctx.fillStyle = tier.textColor
    ctx.textBaseline = 'middle'
    ctx.fillText(tier.name.toUpperCase(), W/2, tierY + imgH + 28)
  } else {
    // Fallback: just the pill
    ctx.font = '700 20px "DM Sans", sans-serif'
    const pillW = ctx.measureText(tier.name.toUpperCase()).width + 48
    ctx.fillStyle = tier.bg
    ctx.beginPath()
    ctx.roundRect(W/2 - pillW/2, tierY, pillW, 40, 20)
    ctx.fill()
    ctx.fillStyle = tier.textColor
    ctx.textBaseline = 'middle'
    ctx.fillText(tier.name.toUpperCase(), W/2, tierY + 20)
  }

  // ── Elo rating ──
  const eloY = tierImg ? 460 : 360
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#DC2626'
  ctx.font = '800 112px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(player.elo || 800), W/2, eloY)
  ctx.fillStyle = '#94A3B8'
  ctx.font = '700 14px "JetBrains Mono", monospace'
  ctx.fillText('E L O   R A T I N G', W/2, eloY + 120)

  // ── Divider ──
  const divY = eloY + 155
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(100, divY)
  ctx.lineTo(W - 100, divY)
  ctx.stroke()

  // ── Stats row ──
  const statsY = divY + 25
  const stats = [
    { label: 'WINS', value: String(player.wins || 0), color: '#065F46' },
    { label: 'LOSSES', value: String(player.losses || 0), color: '#64748B' },
    { label: 'GAMES', value: String(player.games_played || 0), color: '#0F172A' },
    { label: 'WIN %', value: (player.games_played ? Math.round((player.wins||0)/(player.games_played)*100) : 0) + '%', color: '#F59E0B' },
  ]
  const statW = 200, statGap = 28
  const statsStartX = (W - (stats.length * statW + (stats.length - 1) * statGap)) / 2

  stats.forEach((s, i) => {
    const x = statsStartX + i * (statW + statGap)
    ctx.fillStyle = '#F8FAFC'
    ctx.beginPath()
    ctx.roundRect(x, statsY, statW, 100, 14)
    ctx.fill()
    ctx.fillStyle = s.color
    ctx.beginPath()
    ctx.roundRect(x, statsY, statW, 4, [14, 14, 0, 0])
    ctx.fill()
    ctx.fillStyle = s.color
    ctx.font = '700 40px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(s.value, x + statW/2, statsY + 18)
    ctx.fillStyle = '#94A3B8'
    ctx.font = '700 11px "DM Sans", sans-serif'
    ctx.fillText(s.label, x + statW/2, statsY + 72)
  })

  // ── Badges section ──
  const badgeStartY = statsY + 140
  ctx.fillStyle = '#0F172A'
  ctx.font = '700 26px Outfit, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const badgesLabel = 'Badges'
  ctx.fillText(badgesLabel, 80, badgeStartY)
  ctx.fillStyle = '#94A3B8'
  ctx.font = '500 26px Outfit, sans-serif'
  const badgesLabelW = ctx.measureText(badgesLabel).width
  ctx.fillText('  ' + earnedBadges.length + '/' + BADGES.length, 80 + badgesLabelW - 10, badgeStartY)

  // Badge grid
  const badgeCols = 5, badgeW = 170, badgeH = 80, badgeGap = 14
  const badgeGridW = badgeCols * badgeW + (badgeCols - 1) * badgeGap
  const badgeGridX = (W - badgeGridW) / 2
  let bx = badgeGridX, by = badgeStartY + 50

  earnedBadges.forEach((eb, i) => {
    const badge = BADGES.find(b => b.id === eb.badge_id)
    if (!badge) return
    ctx.fillStyle = '#F8FAFC'
    ctx.beginPath()
    ctx.roundRect(bx, by, badgeW, badgeH, 10)
    ctx.fill()
    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.roundRect(bx, by + 8, 3, badgeH - 16, 2)
    ctx.fill()
    ctx.font = '28px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badge.emoji, bx + 30, by + badgeH/2)
    ctx.fillStyle = '#0F172A'
    ctx.font = '600 13px "DM Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(badge.name, bx + 52, by + badgeH/2)
    bx += badgeW + badgeGap
    if ((i + 1) % badgeCols === 0) {
      bx = badgeGridX
      by += badgeH + badgeGap
    }
  })

  // ── Footer ──
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(0, H - 100, W, 100)
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, H - 100)
  ctx.lineTo(W, H - 100)
  ctx.stroke()
  ctx.fillStyle = '#065F46'
  ctx.fillRect(0, H - 4, W, 4)

  // Logo in footer
  ctx.font = '700 28px Outfit, sans-serif'
  ctx.textBaseline = 'middle'
  const fMahjW = ctx.measureText('Mahj').width
  const fTotalW = fMahjW + ctx.measureText('Rank').width
  const fX = W / 2 - fTotalW / 2
  ctx.fillStyle = '#065F46'
  ctx.textAlign = 'left'
  ctx.fillText('Mahj', fX, H - 58)
  ctx.fillStyle = '#DC2626'
  ctx.fillText('Rank', fX + fMahjW, H - 58)

  // Date + URL
  ctx.fillStyle = '#94A3B8'
  ctx.font = '400 14px "DM Sans", sans-serif'
  ctx.textAlign = 'center'
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  ctx.fillText('mahjrank.com  ·  Date Created: ' + today, W/2, H - 28)

  // ── Export ──
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
  if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    try {
      const file = new File([blob], 'mahjrank-card.png', { type: 'image/png' })
      await navigator.share({ files: [file], title: player.name + ' on MahjRank' })
      return
    } catch (e) { /* fallback */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mahjrank-' + (player.name||'player').toLowerCase().replace(/\s+/g,'-') + '.png'
  a.click()
  URL.revokeObjectURL(url)
}
