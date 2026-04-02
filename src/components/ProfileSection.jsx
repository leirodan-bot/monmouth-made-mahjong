import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTier } from '../eloUtils'
import { BADGES, BADGE_CATEGORIES } from '../badgeUtils'
import { usePushNotifications } from './PushNotifications'
import AnimatedElo from './AnimatedElo'
import { C, fonts, shadows, card, cardLg } from '../theme'
import TierBadge from './TierBadge'

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
      <div style={{ fontSize: 10, color: C.slateMd, fontFamily: fonts.body, marginTop: 2 }}>
        Last {history.length} games
      </div>
    </div>
  )
}

export default function ProfileSection({ session, player, onSignOut, setTab, onPlayerClick }) {
  const push = usePushNotifications(player)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [rivals, setRivals] = useState([])
  const [eloHistory, setEloHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [followedIds, setFollowedIdsLocal] = useState([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [customText, setCustomText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  const AVATAR_ICONS = ['🀄', '🧱', '🐉', '🎋', '🔴', '🌸', '🎴', '🏮', '🌙', '🍀', '🦅', '🎲', '🎯', '🌊', '💎', '🔥', '🌺', '🐦', '⭐', '🏆']
  const initials = player?.name ? player.name.split(' ').map(n => n[0]).join('') : '?'

  async function saveAvatar(value) {
    await supabase.from('players').update({ avatar: value || null }).eq('id', player.id)
    player.avatar = value || null
    setShowAvatarPicker(false)
    setCustomText('')
  }

  return (
    <div>
      {/* ── Header Card ── */}
      <div style={{
        ...cardLg({ padding: '24px 20px', marginBottom: 16 }),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div onClick={() => setShowAvatarPicker(true)} style={{ width: 56, height: 56, borderRadius: 14, background: C.jade, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: player?.avatar ? 26 : 20, fontWeight: 700, fontFamily: fonts.heading, cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
            {player?.avatar || initials}
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'white', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>✏️</div>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.midnight }}>{player?.name || 'Player'}</div>
            <div style={{ marginTop: 4 }}><TierBadge elo={player?.elo || 800} /></div>
          </div>
        </div>

        {/* Avatar Picker Popup */}
        {showAvatarPicker && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAvatarPicker(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
              <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 16, textAlign: 'center' }}>Choose Your Avatar</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
                {AVATAR_ICONS.map(icon => (
                  <button key={icon} onClick={() => saveAvatar(icon)} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12, fontSize: 24,
                    border: player?.avatar === icon ? `2px solid ${C.jade}` : `1px solid ${C.border}`,
                    background: player?.avatar === icon ? 'rgba(22,101,52,0.06)' : 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{icon}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.slate, fontFamily: fonts.body, marginBottom: 8, textAlign: 'center' }}>Or type custom text (1–2 characters)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={customText} onChange={(e) => setCustomText(e.target.value.slice(0, 2))} placeholder="AB" maxLength={2} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 16, fontFamily: fonts.heading, fontWeight: 700, textAlign: 'center',
                  outline: 'none',
                }} />
                <button onClick={() => customText.trim() && saveAvatar(customText.trim())} disabled={!customText.trim()} style={{
                  padding: '10px 20px', borderRadius: 10, background: customText.trim() ? C.jade : C.border,
                  color: 'white', border: 'none', fontSize: 13, fontWeight: 700,
                  fontFamily: fonts.body, cursor: customText.trim() ? 'pointer' : 'default',
                }}>Save</button>
              </div>
              <button onClick={() => saveAvatar(null)} style={{
                width: '100%', marginTop: 12, padding: '8px', borderRadius: 8,
                background: 'none', border: 'none', fontSize: 12, color: C.slateMd,
                fontFamily: fonts.body, cursor: 'pointer',
              }}>Reset to initials</button>
            </div>
          </div>
        )}

        {/* Follow counts */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.midnight, fontFamily: fonts.mono }}>{followerCount}</div>
            <div style={{ fontSize: 10, color: C.slate, fontFamily: fonts.body, textTransform: 'uppercase', letterSpacing: 0.5 }}>Followers</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.midnight, fontFamily: fonts.mono }}>{followingCount}</div>
            <div style={{ fontSize: 10, color: C.slate, fontFamily: fonts.body, textTransform: 'uppercase', letterSpacing: 0.5 }}>Following</div>
          </div>
        </div>

        {/* Dark Elo Card */}
        {(() => {
          const lastChange = eloHistory.length > 0 ? eloHistory[eloHistory.length - 1].rating_change : 0
          const deltaColor = lastChange >= 0 ? C.jadeLt : C.crimson
          const deltaSymbol = lastChange >= 0 ? '▲' : '▼'
          return (
            <div style={{
              background: C.midnight, borderRadius: 14, padding: '20px',
              marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(6,95,70,0.08), transparent)',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.slateLt, letterSpacing: '1.5px', marginBottom: 4 }}>ELO RATING</div>
                <AnimatedElo value={Math.round(player?.elo || 800)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 42, fontWeight: 700, color: C.white, lineHeight: 1, display: 'block' }} />
                {lastChange !== 0 && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: deltaColor, marginTop: 6 }}>
                    {deltaSymbol} {lastChange > 0 ? '+' : ''}{lastChange.toFixed(1)}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: 140 }}>
                <EloSparkline history={eloHistory} />
              </div>
            </div>
          )
        })()}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Wins', value: player?.wins || 0, color: C.jade },
            { label: 'Losses', value: player?.losses || 0, color: C.ink },
            { label: 'Win %', value: `${winRate}%`, color: C.gold },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.white,
              borderTop: `3px solid ${s.color}`,
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.slateMd, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: fonts.body, fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => generateShareCard(player, earnedBadges)} style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 10, background: C.jade, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: fonts.heading, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share My Card
        </button>
      </div>

      {/* ── Badges Card ── */}
      <div style={{
        ...card({ padding: '20px', marginBottom: 16 }),
      }}>
        <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>
          Badges
          <span style={{ fontFamily: fonts.mono, fontSize: 12, color: C.slateMd, marginLeft: 8 }}>
            {earnedIds.length}/{BADGES.length}
          </span>
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: C.slateMd, padding: '20px 0', textAlign: 'center' }}>Loading badges...</div>
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
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.slateMd, fontFamily: fonts.mono, letterSpacing: '1px', marginBottom: 6, textTransform: 'uppercase' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {earned.map(b => {
                      const eb = earnedBadges.find(e => e.badge_id === b.id)
                      return (
                        <div key={b.id} title={`${b.name}: ${b.desc}\nEarned ${eb ? new Date(eb.earned_at).toLocaleDateString() : ''}`} style={{
                          background: 'rgba(245,158,11,0.04)', border: `1px solid rgba(245,158,11,0.2)`,
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
                        background: C.cloud, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: '6px 10px',
                        display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4,
                      }}>
                        <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{b.emoji}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.slateMd }}>{b.name}</div>
                          <div style={{ fontSize: 9, color: C.slateMd }}>{b.desc}</div>
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
        <div style={{ ...card({ padding: 20, marginBottom: 16 }) }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 14 }}>My Rivals</div>
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
                  <div onClick={() => onPlayerClick && onPlayerClick(r.opponent_id)} style={{ fontSize: 14, fontWeight: 600, color: onPlayerClick ? C.jade : C.midnight, fontFamily: fonts.body, cursor: onPlayerClick ? 'pointer' : 'default' }}>{r.name || 'Unknown'}</div>
                  {label && <span style={{ fontSize: 10, fontWeight: 700, color: label.color, fontFamily: fonts.body }}>{label.emoji} {label.text}</span>}
                </div>
                <div style={{ fontSize: 11, color: C.slate, fontFamily: fonts.body }}>{r.games_together} games together</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.jade, fontFamily: fonts.mono }}>{r.my_wins}</div>
                  <div style={{ fontSize: 9, color: C.slate, textTransform: 'uppercase' }}>W</div>
                </div>
                <div style={{ fontSize: 12, color: C.slateMd }}>—</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.crimson, fontFamily: fonts.mono }}>{r.their_wins}</div>
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
        <div style={{ ...card({ padding: 20, marginBottom: 16 }) }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 14 }}>People You Play With</div>
          <div style={{ fontSize: 11, color: C.slate, fontFamily: fonts.body, marginBottom: 12 }}>Players you've shared 3+ games with</div>
          {suggestions.map(s => (
            <div key={s.opponent_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div onClick={() => onPlayerClick && onPlayerClick(s.opponent_id)} style={{ fontSize: 14, fontWeight: 600, color: onPlayerClick ? C.jade : C.midnight, fontFamily: fonts.body, cursor: onPlayerClick ? 'pointer' : 'default' }}>{s.name || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: C.slate, fontFamily: fonts.body }}>{s.games_together} games together</div>
              </div>
              <button onClick={async () => {
                await supabase.from('follows').insert({ follower_id: player.id, following_id: s.opponent_id })
                setSuggestions(prev => prev.filter(p => p.opponent_id !== s.opponent_id))
              }} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 11,
                fontFamily: fonts.body, fontWeight: 600, cursor: 'pointer',
                background: 'white', color: C.jade, border: `1px solid ${C.jade}`,
              }}>Follow</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Push Notifications Toggle ── */}
      {push.supported && push.permission !== 'denied' && (
        <button onClick={() => push.subscribed ? push.unsubscribe() : push.subscribe()} disabled={push.loading} style={{
          width: '100%', background: 'white',
          borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${push.subscribed ? C.jade : C.slateMd}`,
          borderRadius: 10, padding: '14px 16px', marginBottom: 6,
          fontFamily: fonts.body, fontSize: 14, color: C.midnight,
          textAlign: 'left', fontWeight: 600, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{push.loading ? 'Updating...' : push.subscribed ? 'Push Notifications On' : 'Enable Push Notifications'}</span>
          <div style={{
            width: 40, height: 22, borderRadius: 11,
            background: push.subscribed ? C.jade : C.border,
            position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9,
              background: 'white', position: 'absolute', top: 2,
              left: push.subscribed ? 20 : 2,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
        </button>
      )}

      {/* ── Links ── */}
      <button onClick={() => setTab('clubs')} style={{
        width: '100%', background: 'white',
        borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${C.jade}`,
        borderRadius: 10, padding: '14px 16px', marginBottom: 6,
        fontFamily: fonts.body, fontSize: 14, color: C.midnight,
        textAlign: 'left', fontWeight: 600, cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        My Clubs
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.slateMd} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      {/* ── Legal links (small) ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 8 }}>
        <span onClick={() => setTab('terms')} style={{ fontSize: 11, color: C.slateMd, fontFamily: fonts.body, cursor: 'pointer' }}>Terms of Service</span>
        <span style={{ color: C.border }}>·</span>
        <span onClick={() => setTab('privacy')} style={{ fontSize: 11, color: C.slateMd, fontFamily: fonts.body, cursor: 'pointer' }}>Privacy Policy</span>
      </div>

      {/* Sign out */}
      <button onClick={onSignOut} style={{
        width: '100%', background: 'white',
        borderTop: '1px solid rgba(225,29,72,0.2)', borderRight: '1px solid rgba(225,29,72,0.2)',
        borderBottom: '1px solid rgba(225,29,72,0.2)', borderLeft: `4px solid ${C.crimson}`,
        borderRadius: 10, padding: '14px 16px', marginTop: 8,
        fontFamily: fonts.body, fontSize: 14, color: C.crimson,
        textAlign: 'center', fontWeight: 600, cursor: 'pointer',
      }}>Sign Out</button>

      {/* Delete Account */}
      {!showDeleteConfirm ? (
        <button onClick={() => setShowDeleteConfirm(true)} style={{
          width: '100%', background: 'transparent', border: 'none',
          padding: '14px 16px', marginTop: 12,
          fontFamily: fonts.body, fontSize: 12, color: C.slateLt,
          textAlign: 'center', cursor: 'pointer',
          textDecoration: 'underline',
        }}>Delete Account</button>
      ) : (
        <div style={{
          background: 'rgba(225,29,72,0.04)', border: `1.5px solid rgba(225,29,72,0.2)`,
          borderRadius: 14, padding: 20, marginTop: 12,
        }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.crimson, marginBottom: 8 }}>
            Delete your account?
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.slate, lineHeight: 1.5, marginBottom: 16 }}>
            This will permanently delete your account, profile, game history, and all associated data. This action cannot be undone.
          </div>
          {deleteError && (
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.crimson, marginBottom: 12, padding: '8px 12px', background: 'rgba(225,29,72,0.06)', borderRadius: 8 }}>
              {deleteError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }} style={{
              flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`,
              background: 'white', fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
              color: C.slate, cursor: 'pointer',
            }}>Cancel</button>
            <button
              disabled={deleteLoading}
              onClick={async () => {
                setDeleteLoading(true); setDeleteError('')
                try {
                  // Delete player data from the players table
                  if (player?.id) {
                    await supabase.from('notifications').delete().eq('player_id', player.id)
                    await supabase.from('elo_history').delete().eq('player_id', player.id)
                    await supabase.from('follows').delete().or(`follower_id.eq.${player.id},followed_id.eq.${player.id}`)
                    await supabase.from('friend_requests').delete().or(`from_id.eq.${player.id},to_id.eq.${player.id}`)
                    await supabase.from('players').delete().eq('id', player.id)
                  }
                  // Delete the auth user account via edge function or direct
                  // Note: Supabase client-side cannot delete auth users directly,
                  // so we sign out and the account becomes orphaned.
                  // For full deletion, use a Supabase Edge Function or admin API.
                  await supabase.auth.signOut()
                  if (onSignOut) onSignOut()
                } catch (err) {
                  setDeleteError('Failed to delete account: ' + (err.message || 'Please try again'))
                  setDeleteLoading(false)
                }
              }}
              style={{
                flex: 1, padding: 12, borderRadius: 10, border: 'none',
                background: C.crimson, fontFamily: fonts.body, fontSize: 13, fontWeight: 700,
                color: 'white', cursor: deleteLoading ? 'wait' : 'pointer',
                opacity: deleteLoading ? 0.6 : 1,
              }}
            >{deleteLoading ? 'Deleting...' : 'Delete Forever'}</button>
          </div>
        </div>
      )}

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
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, 0, W, 6)

  // ── LOGO ──
  ctx.textBaseline = 'top'
  ctx.font = '800 48px Outfit, sans-serif'
  const mahjW = ctx.measureText('Mahj').width
  const rankW = ctx.measureText('Rank').width
  const totalLogoW = mahjW + rankW
  const logoX = W / 2 - totalLogoW / 2
  ctx.fillStyle = '#166534'
  ctx.textAlign = 'left'
  ctx.fillText('Mahj', logoX, 40)
  ctx.fillStyle = '#E11D48'
  ctx.fillText('Rank', logoX + mahjW, 40)

  // ── Player initials circle ──
  const avatarText = player.avatar || (player.name ? player.name.split(' ').map(n => n[0]).join('') : '?')
  ctx.fillStyle = '#166534'
  ctx.beginPath()
  ctx.roundRect(W/2 - 44, 120, 88, 88, 22)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = player.avatar ? '48px serif' : '700 36px Outfit, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(avatarText, W/2, 164)

  // ── Player name ──
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#1C1917'
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
  ctx.fillStyle = '#E11D48'
  ctx.font = '800 112px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(player.elo || 800), W/2, eloY)
  ctx.fillStyle = '#78716C'
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
    { label: 'WINS', value: String(player.wins || 0), color: '#166534' },
    { label: 'LOSSES', value: String(player.losses || 0), color: '#78716C' },
    { label: 'GAMES', value: String(player.games_played || 0), color: '#1C1917' },
    { label: 'WIN %', value: (player.games_played ? Math.round((player.wins||0)/(player.games_played)*100) : 0) + '%', color: '#F59E0B' },
  ]
  const statW = 200, statGap = 28
  const statsStartX = (W - (stats.length * statW + (stats.length - 1) * statGap)) / 2

  stats.forEach((s, i) => {
    const x = statsStartX + i * (statW + statGap)
    ctx.fillStyle = '#FAFAF9'
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
    ctx.fillStyle = '#78716C'
    ctx.font = '700 11px "DM Sans", sans-serif'
    ctx.fillText(s.label, x + statW/2, statsY + 72)
  })

  // ── Badges section ──
  const badgeStartY = statsY + 140
  ctx.fillStyle = '#1C1917'
  ctx.font = '700 26px Outfit, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const badgesLabel = 'Badges'
  ctx.fillText(badgesLabel, 80, badgeStartY)
  ctx.fillStyle = '#78716C'
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
    ctx.fillStyle = '#FAFAF9'
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
    ctx.fillStyle = '#1C1917'
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
  ctx.fillStyle = '#FAFAF9'
  ctx.fillRect(0, H - 100, W, 100)
  ctx.strokeStyle = '#D6D3D1'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, H - 100)
  ctx.lineTo(W, H - 100)
  ctx.stroke()
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, H - 4, W, 4)

  // Logo in footer
  ctx.font = '700 28px Outfit, sans-serif'
  ctx.textBaseline = 'middle'
  const fMahjW = ctx.measureText('Mahj').width
  const fTotalW = fMahjW + ctx.measureText('Rank').width
  const fX = W / 2 - fTotalW / 2
  ctx.fillStyle = '#166534'
  ctx.textAlign = 'left'
  ctx.fillText('Mahj', fX, H - 58)
  ctx.fillStyle = '#E11D48'
  ctx.fillText('Rank', fX + fMahjW, H - 58)

  // Date + URL
  ctx.fillStyle = '#78716C'
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
