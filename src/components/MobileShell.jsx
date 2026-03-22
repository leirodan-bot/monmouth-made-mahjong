import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import logoHeader from '../assets/mahjrank/mahjranklogotransparent2400.png'
import NotificationBell from './NotificationBell'
import Homepage from './Homepage'
import Rankings from './Rankings'
import Towns from './Towns'
import Players from './Players'
import Clubs from './Clubs'
import RecordMatch from './RecordMatch'
import HowItWorks from './HowItWorks'
import ActivityFeed from './ActivityFeed'
import TermsOfService from './TermsOfService'
import PrivacyPolicy from './PrivacyPolicy'
import CookiePolicy from './CookiePolicy'
import Auth from './Auth'
import InstallPrompt from './InstallPrompt'

import ProfileSection from "./ProfileSection"
const C = {
  jade: '#065F46',
  jadeLt: '#059669',
  crimson: '#DC2626',
  gold: '#F59E0B',
  goldDk: '#D97706',
  midnight: '#0F172A',
  ink: '#1E293B',
  cloud: '#EDF0F4',
  slate: '#64748B',
  slateLt: '#94A3B8',
  border: '#E2E8F0', cloudLt: '#FFFFFF',
}

// Helper: makes a style with a colored left accent border
function accentCard(accent, extra = {}) {
  return {
    background: 'white',
    borderTop: `1px solid ${C.border}`,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accent}`,
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    ...extra,
  }
}

function accentLink(accent) {
  return {
    width: '100%',
    background: 'white',
    borderTop: `1px solid ${C.border}`,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accent}`,
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: C.midnight,
    cursor: 'pointer',
  }
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'rankings', label: 'Rankings', icon: RankingsIcon },
  { id: 'record', label: 'Log', icon: LogIcon, center: true },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
]

function TierBadge({ elo }) {
  let tier, color, bg
  if (elo >= 1100) { tier = 'Grandmaster'; color = '#7C3AED'; bg = 'rgba(124,58,237,0.08)' }
  else if (elo >= 1000) { tier = 'Master'; color = '#6366F1'; bg = 'rgba(99,102,241,0.08)' }
  else if (elo >= 900) { tier = 'Expert'; color = C.goldDk; bg = 'rgba(245,158,11,0.08)' }
  else if (elo >= 800) { tier = 'Skilled'; color = C.slateLt; bg = 'rgba(148,163,184,0.08)' }
  else if (elo >= 700) { tier = 'Beginner'; color = '#B45309'; bg = 'rgba(180,83,9,0.06)' }
  else { tier = 'Novice'; color = C.slate; bg = 'rgba(100,116,139,0.06)' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
      color, background: bg, borderTop: `1px solid ${color}22`, borderRight: `1px solid ${color}22`, borderBottom: `1px solid ${color}22`, borderLeft: `1px solid ${color}22`,
      padding: '3px 10px', borderRadius: 6,
    }}>{tier}</span>
  )
}

function Chevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.slateLt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

export default function MobileShell({ session, player, onSignOut, refreshPlayer }) {
  const [tab, setTab] = useState(session ? 'home' : 'landing')
  const [pendingCount, setPendingCount] = useState(0)
  const [awaitingCount, setAwaitingCount] = useState(0)

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

  useEffect(() => {
    if (session && tab === 'landing') setTab('home')
    if (!session) setTab('landing')
  }, [session])

  useEffect(() => { window.scrollTo(0, 0) }, [tab])

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
  const showBottomNav = !isLegalPage && tab !== 'login' && tab !== 'howitworks'

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
          {session && player && <NotificationBell player={player} onNavigate={setTab} refreshPlayer={refreshPlayer} onCountChange={(count) => setPendingCount(count)} />}
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
              <div style={accentCard(C.jade, { padding: '20px', marginBottom: 14 })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Welcome back,</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: C.midnight, letterSpacing: -0.5 }}>{player?.name || 'Player'}</div>
                  </div>
                  <TierBadge elo={player?.elo || 800} />
                </div>

                {/* Stat boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Games', value: player?.games_played || 0, color: C.jadeLt },
                    { label: 'Wins', value: player?.wins || 0, color: C.ink },
                    { label: 'Elo', value: Math.round(player?.elo || 800), color: C.crimson },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: C.cloudLt,
                      borderTop: `3px solid ${s.color}`,
                      borderRight: `1px solid ${C.border}`,
                      borderBottom: `1px solid ${C.border}`,
                      borderLeft: `1px solid ${C.border}`,
                      borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", marginTop: 6, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending confirmations */}
              {pendingCount > 0 && (
                <button onClick={() => setTab('activity')} style={{
                  width: '100%', background: 'rgba(245,158,11,0.05)',
                  borderTop: '1px solid rgba(245,158,11,0.15)', borderRight: '1px solid rgba(245,158,11,0.15)',
                  borderBottom: '1px solid rgba(245,158,11,0.15)', borderLeft: `4px solid ${C.gold}`,
                  borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: C.gold, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{pendingCount}</div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ color: C.goldDk, fontSize: 13, fontWeight: 600 }}>{pendingCount === 1 ? 'game needs' : 'games need'} your review</div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 1 }}>Tap to review and confirm</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.goldDk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}

              {/* Awaiting verification */}
              {awaitingCount > 0 && (
                <div style={{
                  width: '100%', background: 'rgba(245,158,11,0.10)',
                  borderTop: '1px solid rgba(245,158,11,0.35)', borderRight: '1px solid rgba(245,158,11,0.35)',
                  borderBottom: '1px solid rgba(245,158,11,0.35)', borderLeft: `4px solid ${C.goldDk}`,
                  borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 14, fontFamily: "'DM Sans', sans-serif",
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(245,158,11,0.25)', color: C.goldDk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{awaitingCount}</div>
                  <div>
                    <div style={{ color: C.goldDk, fontSize: 13, fontWeight: 600 }}>{awaitingCount === 1 ? 'game' : 'games'} awaiting verification</div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 1 }}>Waiting for another player to confirm</div>
                  </div>
                </div>
              )}

              {/* Record a Game */}
              <button onClick={() => setTab('record')} style={{
                width: '100%', background: C.crimson, border: 'none', borderRadius: 14, padding: '16px', color: '#fff',
                fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(220,38,38,0.25)', letterSpacing: -0.3,
              }}>
                <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Record a Game
              </button>

              {/* Quick links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Rankings', icon: '🏆', sub: 'See where you stand', tab: 'rankings', accent: C.gold },
                  { label: 'My Clubs', icon: '🏘️', sub: 'Your groups & games', tab: 'clubs', accent: C.jade },
                  { label: 'How It Works', icon: '📖', sub: 'Elo ratings explained', tab: 'howitworks', accent: C.jadeLt },
                  { label: 'Players', icon: '👥', sub: 'Browse all players', tab: 'players', accent: C.crimson },
                ].map((link, i) => (
                  <button key={i} onClick={() => setTab(link.tab)} style={{
                    background: 'white',
                    borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                    borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${link.accent}`,
                    borderRadius: 14, padding: '18px 16px', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{link.icon}</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: C.midnight, letterSpacing: -0.2 }}>{link.label}</div>
                    <div style={{ fontSize: 11, color: C.slateLt, marginTop: 3, lineHeight: 1.3 }}>{link.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ PROFILE TAB ═══════ */}
          {tab === 'profile' && session && (
            <ProfileSection session={session} player={player} onSignOut={onSignOut} setTab={setTab} />
          )}

          {tab === 'rankings' && <Rankings session={session} player={player} />}
          {tab === 'towns' && <Towns />}
          {tab === 'players' && session && <Players session={session} player={player} />}
          {tab === 'clubs' && session && <Clubs session={session} player={player} />}
          {tab === 'record' && session && <RecordMatch session={session} player={player} refreshPlayer={refreshPlayer} />}
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
            const showBadge = item.id === 'activity' && pendingCount > 0
            if (item.center) {
              return (
                <button key={item.id} onClick={() => setTab(item.id)} style={{
                  background: C.crimson, border: 'none', width: 52, height: 52, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20,
                  boxShadow: '0 4px 20px rgba(220,38,38,0.3)', position: 'relative', cursor: 'pointer',
                }}><Icon color="#fff" size={24} /></button>
              )
            }
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '4px 12px 8px', position: 'relative', minWidth: 56, cursor: 'pointer',
              }}>
                <div style={{ position: 'relative' }}>
                  <Icon color={isActive ? C.midnight : C.slateLt} size={22} />
                  {showBadge && (
                    <div style={{ position: 'absolute', top: -4, right: -8, background: C.crimson, color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>{pendingCount}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: isActive ? 700 : 500, color: isActive ? C.midnight : C.slateLt }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
      <InstallPrompt />
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
function ProfileIcon({ color, size }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)
}