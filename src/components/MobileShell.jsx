import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import logoHeader from '../assets/mahjrank/mahjranklogotransparent2400.png'
import NotificationBell from './NotificationBell'
import Homepage from './Homepage'
import Rankings from './Rankings'
import Towns from './Towns'
import Players from './Players'
import Clubs from './Clubs'
import Social from './Social'
import RecordMatch from './RecordMatch'
import HowItWorks from './HowItWorks'
import ActivityFeed from './ActivityFeed'
import TermsOfService from './TermsOfService'
import PrivacyPolicy from './PrivacyPolicy'
import CookiePolicy from './CookiePolicy'
import Auth from './Auth'
import InstallPrompt from './InstallPrompt'
import { MyCodeModal, AddFriendModal } from './QRFriend'

import ProfileSection from "./ProfileSection"
import AnimatedElo from './AnimatedElo'
import { C, fonts, shadows, card, cardLg, statusCard } from '../theme'
import useFriends from '../useFriends'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'rankings', label: 'Rankings', icon: RankingsIcon },
  { id: 'record', label: 'Log', icon: LogIcon, center: true },
  { id: 'social', label: 'Social', icon: SocialIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
]

import TierBadge from './TierBadge'

function Chevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.slateLt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

export default function MobileShell({ session, player, onSignOut, refreshPlayer }) {
  const [tab, setTab] = useState(session ? 'home' : 'landing')
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [awaitingCount, setAwaitingCount] = useState(0)
  const [homeExpanded, setHomeExpanded] = useState(null) // 'friends' | 'review' | 'awaiting' | null
  const [statPanel, setStatPanel] = useState(null) // 'games' | 'wins' | 'elo' | null
  const [gameHistory, setGameHistory] = useState([])
  const [eloHistory, setEloHistory] = useState([])
  const [gamePlayers, setGamePlayers] = useState({})
  const [gameLocations, setGameLocations] = useState({})
  const [statsLoading, setStatsLoading] = useState(false)
  const [showMyCode, setShowMyCode] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const { pending: friendRequests } = useFriends(player?.id, player?.name)

  useEffect(() => {
    if (!player) return
    fetchAwaitingCount()
    const interval = setInterval(fetchAwaitingCount, 30000)
    return () => clearInterval(interval)
  }, [player])

  useEffect(() => {
    if (tab === 'home' && player?.id) {
      fetchAwaitingCount()
      if (refreshPlayer) refreshPlayer()
    }
  }, [tab])

  async function fetchAwaitingCount() {
    if (!player) return
    try {
      const { count } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('submitted_by', player.id)
        .eq('status', 'pending')
      setAwaitingCount(count || 0)
    } catch {
      setAwaitingCount(0)
    }
  }

  // Fetch game history + elo history when stat panel opens
  useEffect(() => {
    if (!statPanel || !player?.id) return
    if (gameHistory.length > 0 && eloHistory.length > 0) return // already loaded
    setStatsLoading(true)
    ;(async () => {
      // Fetch matches this player was in
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .contains('player_ids', [player.id])
        .order('played_at', { ascending: false })
        .limit(50)
      if (matches) {
        setGameHistory(matches)
        // Gather all player IDs and location IDs
        const allPlayerIds = new Set()
        const allLocationIds = new Set()
        matches.forEach(m => {
          (m.player_ids || []).forEach(id => allPlayerIds.add(id))
          if (m.location_id) allLocationIds.add(m.location_id)
        })
        // Fetch player names
        if (allPlayerIds.size > 0) {
          const { data: pData } = await supabase.from('players').select('id, name, avatar').in('id', [...allPlayerIds])
          if (pData) {
            const map = {}
            pData.forEach(p => { map[p.id] = p })
            setGamePlayers(map)
          }
        }
        // Fetch location names
        if (allLocationIds.size > 0) {
          const { data: lData } = await supabase.from('locations').select('id, name').in('id', [...allLocationIds])
          if (lData) {
            const map = {}
            lData.forEach(l => { map[l.id] = l })
            setGameLocations(map)
          }
        }
      }
      // Fetch elo history
      const { data: history } = await supabase
        .from('elo_history')
        .select('rating_before, rating_after, rating_change, created_at')
        .eq('player_id', player.id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (history) setEloHistory(history)
      setStatsLoading(false)
    })()
  }, [statPanel, player?.id])

  useEffect(() => {
    if (session && tab === 'landing') setTab('home')
    if (!session) setTab('landing')
  }, [session])

  useEffect(() => { window.scrollTo(0, 0); setHomeExpanded(null); setStatPanel(null) }, [tab])

  if (!session && tab === 'landing') {
    return <Homepage setTab={(t) => {
      if (t === 'players') setTab('login')
      else if (t === 'rankings') setTab('rankings')
      else if (t === 'howitworks') setTab('howitworks')
      else if (t === 'terms') setTab('terms')
      else if (t === 'privacy') setTab('privacy')
      else setTab(t)
    }} />
  }

  const isLegalPage = tab === 'terms' || tab === 'privacy' || tab === 'cookies'
  const showBottomNav = !isLegalPage && tab !== 'login'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.cloud }}>

      {/* ===== TOP BAR ===== */}
      <div style={{
        background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setTab(session ? 'home' : 'landing')}>
          <img src={logoHeader} alt="MahjRank" style={{ height: 56 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {session && player && <NotificationBell player={player} onNavigate={setTab} refreshPlayer={refreshPlayer} onCountChange={({ pending, total }) => { setPendingCount(pending); setUnreadTotal(total); }} />}
          {session ? (
            <button onClick={onSignOut} style={{ background: C.cloud, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.slate, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Sign Out</button>
          ) : (
            <button onClick={() => setTab('login')} style={{ background: C.crimson, border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Sign In</button>
          )}
        </div>
      </div>

      {/* Gradient accent */}
      <div style={{ height: 2, background: `linear-gradient(to right, ${C.jade}, ${C.jadeLt}, ${C.crimson})`, opacity: 0.4 }} />

      {/* ===== CONTENT ===== */}
      <div style={{ flex: 1, paddingBottom: showBottomNav ? 80 : 0 }}>
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px' }}>

          {/* ═══════ HOME TAB ═══════ */}
          {tab === 'home' && session && (
            <div>
              {/* Welcome card */}
              <div style={cardLg({ padding: '24px', marginBottom: 14 })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 15, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Welcome back,</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: C.midnight, letterSpacing: -0.5 }}>{player?.name || 'Player'}</div>
                  </div>
                  <TierBadge elo={player?.elo || 800} />
                </div>

                {/* Stat boxes — clickable */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { key: 'games', label: 'Games', value: player?.games_played || 0, color: C.jadeLt },
                    { key: 'wins', label: 'Wins', value: player?.wins || 0, color: C.ink },
                    { key: 'elo', label: 'Elo', value: Math.round(player?.elo || 800), color: C.crimson },
                  ].map((s) => (
                    <button key={s.key} onClick={() => setStatPanel(statPanel === s.key ? null : s.key)} style={{
                      background: statPanel === s.key ? 'rgba(28,25,23,0.03)' : C.white,
                      borderTop: `3px solid ${s.color}`,
                      borderRight: `1px solid ${statPanel === s.key ? s.color : C.border}`,
                      borderBottom: `1px solid ${statPanel === s.key ? s.color : C.border}`,
                      borderLeft: `1px solid ${statPanel === s.key ? s.color : C.border}`,
                      borderRadius: 14, padding: '18px 12px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}>
                      {s.key === 'elo' ? (
                        <AnimatedElo value={s.value} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1 }} />
                      ) : (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      )}
                      <div style={{ fontSize: 12, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", marginTop: 8, fontWeight: 600 }}>{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ══ Stat Panels ══ */}
              {statPanel === 'games' && (
                <div style={{
                  background: 'white', border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: 20, marginBottom: 14, boxShadow: shadows.md,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.midnight }}>
                      Game History
                    </div>
                    <button onClick={() => setStatPanel(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: C.slate, cursor: 'pointer' }}>✕</button>
                  </div>
                  {statsLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, fontFamily: fonts.body, fontSize: 14, color: C.slate }}>Loading...</div>
                  ) : gameHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, fontFamily: fonts.body, fontSize: 14, color: C.slateLt }}>No games yet. Record your first game!</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {gameHistory.slice(0, 20).map((m, i) => {
                        const isWinner = m.winner_id === player?.id
                        const isWall = m.is_wall_game
                        const otherPlayers = (m.player_ids || []).filter(id => id !== player?.id).map(id => gamePlayers[id]?.name || '?').join(', ')
                        const locName = m.location_id ? gameLocations[m.location_id]?.name : null
                        const date = new Date(m.played_at)
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
                        return (
                          <div key={m.id || i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 14px', borderRadius: 12,
                            background: i % 2 === 0 ? '#FAFAF9' : 'white',
                            border: `1px solid ${C.borderLt || C.border}`,
                          }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                              background: isWall ? C.goldPale : isWinner ? 'rgba(22,101,52,0.06)' : 'rgba(225,29,72,0.06)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 20,
                            }}>
                              {isWall ? '🧱' : isWinner ? '🏆' : '🀄'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.midnight }}>
                                {isWall ? 'Wall Game' : isWinner ? 'You won!' : `${gamePlayers[m.winner_id]?.name || 'Someone'} won`}
                              </div>
                              <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.slate, marginTop: 2 }}>
                                vs {otherPlayers || 'unknown'}
                              </div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: fonts.body, fontSize: 11, color: C.slateLt }}>{dateStr}</span>
                                {locName && <span style={{ fontFamily: fonts.body, fontSize: 11, color: C.slateLt }}>📍 {locName}</span>}
                                {m.hand_section && <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.slateMd, background: C.cloud, padding: '1px 6px', borderRadius: 4 }}>{m.hand_section}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {statPanel === 'wins' && (
                <div style={{
                  background: 'white', border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: 20, marginBottom: 14, boxShadow: shadows.md,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.midnight }}>
                      Win / Loss Stats
                    </div>
                    <button onClick={() => setStatPanel(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: C.slate, cursor: 'pointer' }}>✕</button>
                  </div>
                  {statsLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, fontFamily: fonts.body, fontSize: 14, color: C.slate }}>Loading...</div>
                  ) : (() => {
                    const totalGames = player?.games_played || 0
                    const wins = player?.wins || 0
                    const losses = totalGames - wins
                    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
                    const wallGames = gameHistory.filter(m => m.is_wall_game).length
                    const nonWallGames = totalGames - wallGames

                    // Streak calculation
                    let currentStreak = 0
                    let streakType = null
                    for (let i = 0; i < gameHistory.length; i++) {
                      const m = gameHistory[i]
                      if (m.is_wall_game) continue
                      const won = m.winner_id === player?.id
                      if (streakType === null) { streakType = won ? 'W' : 'L'; currentStreak = 1 }
                      else if ((won && streakType === 'W') || (!won && streakType === 'L')) currentStreak++
                      else break
                    }

                    // Best opponent (most wins against)
                    const winsAgainst = {}
                    gameHistory.forEach(m => {
                      if (m.is_wall_game || m.winner_id !== player?.id) return
                      ;(m.player_ids || []).forEach(id => {
                        if (id !== player?.id) winsAgainst[id] = (winsAgainst[id] || 0) + 1
                      })
                    })
                    const topOpponentId = Object.entries(winsAgainst).sort((a, b) => b[1] - a[1])[0]

                    return (
                      <div>
                        {/* Win rate bar */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: C.jade }}>{wins}W</span>
                            <span style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: C.crimson }}>{losses}L</span>
                          </div>
                          <div style={{ height: 12, borderRadius: 6, background: C.cloud, overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${winRate}%`, background: C.jade, borderRadius: '6px 0 0 6px', transition: 'width 0.5s ease' }} />
                            <div style={{ flex: 1, background: totalGames > 0 ? 'rgba(225,29,72,0.2)' : C.cloud }} />
                          </div>
                          <div style={{ textAlign: 'center', marginTop: 8, fontFamily: fonts.mono, fontSize: 16, fontWeight: 700, color: C.midnight }}>
                            {winRate}% win rate
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ background: '#FAFAF9', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                            <div style={{ fontFamily: fonts.mono, fontSize: 24, fontWeight: 700, color: C.midnight }}>{totalGames}</div>
                            <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.slateLt, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Total Games</div>
                          </div>
                          <div style={{ background: '#FAFAF9', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                            <div style={{ fontFamily: fonts.mono, fontSize: 24, fontWeight: 700, color: C.goldDk }}>{wallGames}</div>
                            <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.slateLt, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Wall Games</div>
                          </div>
                          {currentStreak > 1 && (
                            <div style={{ background: streakType === 'W' ? 'rgba(22,101,52,0.04)' : 'rgba(225,29,72,0.04)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: `1px solid ${streakType === 'W' ? 'rgba(22,101,52,0.15)' : 'rgba(225,29,72,0.15)'}` }}>
                              <div style={{ fontFamily: fonts.mono, fontSize: 24, fontWeight: 700, color: streakType === 'W' ? C.jade : C.crimson }}>{currentStreak}{streakType}</div>
                              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.slateLt, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>Current Streak</div>
                            </div>
                          )}
                          {topOpponentId && (
                            <div style={{ background: '#FAFAF9', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 700, color: C.midnight }}>{gamePlayers[topOpponentId[0]]?.name || '?'}</div>
                              <div style={{ fontFamily: fonts.body, fontSize: 11, color: C.slateLt, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{topOpponentId[1]} wins vs</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {statPanel === 'elo' && (
                <div style={{
                  background: 'white', border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: 20, marginBottom: 14, boxShadow: shadows.md,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.midnight }}>
                      Elo Trend
                    </div>
                    <button onClick={() => setStatPanel(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: C.slate, cursor: 'pointer' }}>✕</button>
                  </div>
                  {statsLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, fontFamily: fonts.body, fontSize: 14, color: C.slate }}>Loading...</div>
                  ) : eloHistory.length < 2 ? (
                    <div style={{ textAlign: 'center', padding: 20, fontFamily: fonts.body, fontSize: 14, color: C.slateLt }}>Play more games to see your Elo trend!</div>
                  ) : (() => {
                    const ratings = eloHistory.map(h => h.rating_after)
                    const min = Math.min(...ratings) - 10
                    const max = Math.max(...ratings) + 10
                    const range = max - min || 1
                    const w = 320, h = 140, padX = 40, padY = 16
                    const chartW = w - padX * 2, chartH = h - padY * 2

                    const points = ratings.map((r, i) => {
                      const x = padX + (i / (ratings.length - 1)) * chartW
                      const y = padY + (1 - (r - min) / range) * chartH
                      return [x, y]
                    })

                    const polyline = points.map(p => `${p[0]},${p[1]}`).join(' ')
                    const lastRating = ratings[ratings.length - 1]
                    const firstRating = ratings[0]
                    const color = lastRating >= firstRating ? C.jade : C.crimson
                    const change = lastRating - firstRating
                    const highElo = Math.max(...ratings)
                    const lowElo = Math.min(...ratings)

                    // Grid lines
                    const gridLines = 4
                    const gridValues = Array.from({ length: gridLines }, (_, i) => Math.round(min + (range * i) / (gridLines - 1)))

                    return (
                      <div>
                        {/* Chart */}
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: '100%' }}>
                            {/* Grid lines */}
                            {gridValues.map((v, i) => {
                              const y = padY + (1 - (v - min) / range) * chartH
                              return (
                                <g key={i}>
                                  <line x1={padX} y1={y} x2={w - padX} y2={y} stroke={C.border} strokeWidth="1" strokeDasharray="3,3" />
                                  <text x={padX - 6} y={y + 4} textAnchor="end" fill={C.slateLt} fontSize="10" fontFamily="JetBrains Mono, monospace">{v}</text>
                                </g>
                              )
                            })}
                            {/* Area fill */}
                            <polygon
                              points={`${points[0][0]},${padY + chartH} ${polyline} ${points[points.length - 1][0]},${padY + chartH}`}
                              fill={lastRating >= firstRating ? 'rgba(22,101,52,0.06)' : 'rgba(225,29,72,0.06)'}
                            />
                            {/* Line */}
                            <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Endpoint dot */}
                            <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="5" fill={color} />
                            <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill="white" />
                          </svg>
                        </div>

                        {/* Summary stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div style={{ background: '#FAFAF9', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                            <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: change >= 0 ? C.jade : C.crimson }}>
                              {change >= 0 ? '+' : ''}{Math.round(change)}
                            </div>
                            <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.slateLt, textTransform: 'uppercase', marginTop: 3 }}>Overall</div>
                          </div>
                          <div style={{ background: '#FAFAF9', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                            <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: C.jade }}>{Math.round(highElo)}</div>
                            <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.slateLt, textTransform: 'uppercase', marginTop: 3 }}>High</div>
                          </div>
                          <div style={{ background: '#FAFAF9', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                            <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: C.crimson }}>{Math.round(lowElo)}</div>
                            <div style={{ fontFamily: fonts.body, fontSize: 10, color: C.slateLt, textTransform: 'uppercase', marginTop: 3 }}>Low</div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 12, fontFamily: fonts.body, fontSize: 12, color: C.slateLt }}>
                          Last {eloHistory.length} games
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ══ Status Bubbles ══ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { key: 'friends', emoji: '👋', label: 'Friends', count: friendRequests.length, activeColor: C.jade, activeBg: 'rgba(22,101,52,0.06)', restLabel: 'No requests' },
                  { key: 'review', emoji: '✅', label: 'Review', count: pendingCount, activeColor: C.crimson, activeBg: 'rgba(225,29,72,0.06)', restLabel: 'All clear' },
                  { key: 'awaiting', emoji: '⏳', label: 'Sent', count: awaitingCount, activeColor: C.goldDk, activeBg: 'rgba(245,158,11,0.06)', restLabel: 'None pending' },
                ].map(b => {
                  const isActive = b.count > 0
                  const isExpanded = homeExpanded === b.key
                  return (
                    <button key={b.key} onClick={() => {
                      if (isActive) setHomeExpanded(isExpanded ? null : b.key)
                    }} style={{
                      background: isExpanded ? b.activeBg : 'white',
                      border: isExpanded ? `2px solid ${b.activeColor}` : `1px solid ${C.border}`,
                      borderRadius: 16, padding: '18px 10px', textAlign: 'center',
                      cursor: isActive ? 'pointer' : 'default',
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: isActive ? shadows.sm : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}>
                      <div style={{ fontSize: 34, marginBottom: 6, lineHeight: 1 }}>{b.emoji}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? b.activeColor : C.slateLt }}>
                        {b.label}
                      </div>
                      {isActive ? (
                        <div style={{
                          position: 'absolute', top: -8, right: -8,
                          minWidth: 28, height: 28, borderRadius: 14,
                          background: C.crimson, color: 'white',
                          fontSize: 14, fontWeight: 800, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          padding: '0 6px', border: '2.5px solid white',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{b.count}</div>
                      ) : (
                        <div style={{ fontSize: 12, color: C.slateLt, marginTop: 4 }}>{b.restLabel}</div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* ══ Expanded panels ══ */}
              {homeExpanded === 'friends' && friendRequests.length > 0 && (
                <FriendRequestsPanel
                  player={player}
                  friendRequests={friendRequests}
                  onClose={() => setHomeExpanded(null)}
                  onViewAll={() => { setHomeExpanded(null); setTab('social') }}
                />
              )}
              {homeExpanded === 'review' && pendingCount > 0 && (
                <div style={{
                  background: 'white', border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: 16, marginBottom: 14, boxShadow: shadows.sm,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: C.midnight }}>
                      Games to Review ({pendingCount})
                    </div>
                    <button onClick={() => setHomeExpanded(null)} style={{ background: 'none', border: 'none', fontSize: 16, color: C.slate, cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
                    Other players submitted games that include you. Tap the bell to review and confirm.
                  </div>
                  <button onClick={() => { setHomeExpanded(null); setTab('activity') }} style={{
                    width: '100%', padding: 12, borderRadius: 10, border: 'none', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer',
                    background: C.crimson, color: 'white', boxShadow: shadows.rose,
                  }}>Review Games →</button>
                </div>
              )}
              {homeExpanded === 'awaiting' && awaitingCount > 0 && (
                <div style={{
                  background: 'white', border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: 16, marginBottom: 14, boxShadow: shadows.sm,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: C.midnight }}>
                      Awaiting Verification ({awaitingCount})
                    </div>
                    <button onClick={() => setHomeExpanded(null)} style={{ background: 'none', border: 'none', fontSize: 16, color: C.slate, cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>
                    You submitted {awaitingCount} {awaitingCount === 1 ? 'game' : 'games'} that {awaitingCount === 1 ? 'is' : 'are'} waiting for another player to confirm. Games auto-verify after 48 hours.
                  </div>
                </div>
              )}

              {/* Record a Game */}
              <button onClick={() => setTab('record')} style={{
                width: '100%', background: C.crimson, border: 'none', borderRadius: 14, padding: '16px', color: '#fff',
                fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(225,29,72,0.25)', letterSpacing: -0.3,
              }}>
                <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Record a Game
              </button>

              {/* ══ Add Friends (QR) ══ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <button onClick={() => setShowMyCode(true)} style={{
                  background: 'white', border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: '20px 16px', textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                  boxShadow: shadows.sm,
                }}>
                  <div style={{ fontSize: 34, marginBottom: 8, lineHeight: 1 }}>📱</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, letterSpacing: -0.2 }}>My Code</div>
                  <div style={{ fontSize: 13, color: C.slateLt, marginTop: 4, lineHeight: 1.3 }}>Show your QR code</div>
                </button>
                <button onClick={() => setShowAddFriend(true)} style={{
                  background: 'white', border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: '20px 16px', textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                  boxShadow: shadows.sm,
                }}>
                  <div style={{ fontSize: 34, marginBottom: 8, lineHeight: 1 }}>👋</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, letterSpacing: -0.2 }}>Add Friend</div>
                  <div style={{ fontSize: 13, color: C.slateLt, marginTop: 4, lineHeight: 1.3 }}>Scan a QR code</div>
                </button>
              </div>

              {/* QR Modals */}
              {showMyCode && <MyCodeModal player={player} onClose={() => setShowMyCode(false)} />}
              {showAddFriend && <AddFriendModal player={player} onClose={() => setShowAddFriend(false)} onAdded={() => {}} />}

              {/* Quick links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Rankings', icon: '🏆', sub: 'See where you stand', tab: 'rankings' },
                  { label: 'Community', icon: '👥', sub: 'Players & clubs', tab: 'social' },
                  { label: 'How It Works', icon: '📖', sub: 'Elo ratings explained', tab: 'howitworks' },
                  { label: 'My Clubs', icon: '🏘️', sub: 'Your groups & games', tab: 'clubs' },
                ].map((link, i) => (
                  <button key={i} onClick={() => setTab(link.tab)} style={{
                    background: 'white',
                    border: `1px solid ${C.border}`,
                    borderRadius: 16, padding: '20px 16px', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                    boxShadow: shadows.sm,
                  }}>
                    <div style={{ fontSize: 34, marginBottom: 8, lineHeight: 1 }}>{link.icon}</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, letterSpacing: -0.2 }}>{link.label}</div>
                    <div style={{ fontSize: 13, color: C.slateLt, marginTop: 4, lineHeight: 1.3 }}>{link.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ PROFILE TAB ═══════ */}
          {tab === 'profile' && session && (
            <ProfileSection session={session} player={player} onSignOut={onSignOut} setTab={setTab} onPlayerClick={(id) => { setSelectedPlayerId(id); setTab('players') }} />
          )}

          {tab === 'rankings' && <Rankings session={session} player={player} onPlayerClick={(id) => { setSelectedPlayerId(id); setTab('social') }} />}
          {tab === 'towns' && <Towns />}
          {tab === 'social' && session && <Social session={session} player={player} initialPlayerId={selectedPlayerId} onClearInitial={() => setSelectedPlayerId(null)} />}
          {tab === 'players' && session && <Players session={session} player={player} initialPlayerId={selectedPlayerId} onClearInitial={() => setSelectedPlayerId(null)} />}
          {tab === 'clubs' && session && <Clubs session={session} player={player} />}
          {tab === 'record' && session && <RecordMatch session={session} player={player} refreshPlayer={refreshPlayer} onDone={() => setTab('home')} />}
          {tab === 'howitworks' && <HowItWorks />}
          {tab === 'activity' && <ActivityFeed player={player} />}
          {tab === 'terms' && <TermsOfService setTab={setTab} />}
          {tab === 'privacy' && <PrivacyPolicy setTab={setTab} />}
          {tab === 'cookies' && <CookiePolicy setTab={setTab} />}
          {tab === 'login' && !session && <Auth onAuth={() => {}} />}
          {!session && tab !== 'login' && tab !== 'rankings' && tab !== 'howitworks' && tab !== 'towns' && tab !== 'terms' && tab !== 'privacy' && tab !== 'cookies' && (
            <Auth onAuth={() => {}} />
          )}
        </main>
      </div>

      {/* ===== BOTTOM NAV ===== */}
      {showBottomNav && session && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: 6, zIndex: 200,
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.id
            const Icon = item.icon
            const showBadge = item.id === 'activity' && unreadTotal > 0
            if (item.center) {
              return (
                <button key={item.id} onClick={() => setTab(item.id)} style={{
                  background: C.crimson, border: 'none', width: 52, height: 52, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -18,
                  boxShadow: '0 4px 16px rgba(220,38,38,0.3)', position: 'relative', cursor: 'pointer',
                }}><Icon color="#fff" size={24} /></button>
              )
            }
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '4px 12px 8px', position: 'relative', minWidth: 56, cursor: 'pointer',
              }}>
                <div style={{ position: 'relative' }}>
                  <Icon color={isActive ? C.jade : C.slateLt} size={22} />
                  {showBadge && (
                    <div style={{ position: 'absolute', top: -4, right: -8, background: C.crimson, color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>{unreadTotal}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: isActive ? 700 : 500, color: isActive ? C.jade : C.slateLt }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
      <InstallPrompt />
    </div>
  )
}

function FriendRequestsPanel({ player, friendRequests, onClose, onViewAll }) {
  const [requestPlayers, setRequestPlayers] = useState([])
  const { acceptRequest, declineRequest } = useFriends(player?.id, player?.name)

  useEffect(() => {
    if (friendRequests.length === 0) { setRequestPlayers([]); return }
    const ids = friendRequests.map(r => r.requester_id)
    supabase.from('players').select('id, name, avatar, elo, town')
      .in('id', ids)
      .then(({ data }) => setRequestPlayers(data || []))
  }, [friendRequests.length])

  return (
    <div style={{
      background: 'white', border: `1px solid ${C.border}`, borderRadius: 14,
      padding: 16, marginBottom: 14, boxShadow: shadows.sm,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: C.midnight }}>
          Friend Requests ({friendRequests.length})
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, color: C.slate, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {friendRequests.map(req => {
          const p = requestPlayers.find(pl => pl.id === req.requester_id)
          if (!p) return null
          const initials = p.name ? p.name.split(' ').map(n => n[0]).join('') : '?'
          return (
            <div key={req.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: C.cloudLt, borderRadius: 12, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: C.jade, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: p.avatar ? 16 : 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", flexShrink: 0,
              }}>{p.avatar || initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.midnight, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{p.town || 'MahjRank player'}</div>
              </div>
              <button onClick={() => acceptRequest(req.requester_id)} style={{
                padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer',
                background: C.jade, color: 'white',
              }}>Accept</button>
              <button onClick={() => declineRequest(req.requester_id)} style={{
                padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                background: 'white', color: C.slate,
              }}>✕</button>
            </div>
          )
        })}
      </div>
      <button onClick={onViewAll} style={{
        width: '100%', marginTop: 10, padding: 10, borderRadius: 10,
        border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600, cursor: 'pointer', background: 'white', color: C.jade,
      }}>View All in Community →</button>
    </div>
  )
}

function HomeIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>)
}
function RankingsIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>)
}
function LogIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>)
}
function ActivityIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>)
}
function SocialIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)
}
function ProfileIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)
}