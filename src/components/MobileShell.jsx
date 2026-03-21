import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import logoHeader from '../assets/logo-header.png'
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

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'rankings', label: 'Rankings', icon: RankingsIcon },
  { id: 'record', label: 'Log', icon: LogIcon, center: true },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
]

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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f4f2' }}>

      {/* ===== TOP BAR ===== */}
      <div style={{
        background: '#1e2b65',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={() => setTab(session ? 'home' : 'landing')}
        >
          <img src={logoHeader} alt="Monmouth Made Mah Jongg" style={{ height: 36 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {session && player && (
            <NotificationBell
              player={player}
              onNavigate={setTab}
              refreshPlayer={refreshPlayer}
              onCountChange={(count) => setPendingCount(count)}
            />
          )}
          {session ? (
            <button
              onClick={onSignOut}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '0.5px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '6px 12px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                fontFamily: 'sans-serif',
              }}
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setTab('login')}
              style={{
                background: '#9f1239',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'sans-serif',
                fontWeight: 700,
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="floral-bg" style={{
        flex: 1,
        paddingBottom: showBottomNav ? 80 : 0,
      }}>
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px' }}>

          {/* Home tab */}
          {tab === 'home' && session && (
            <div>
              {/* Welcome card */}
              <div style={{
                background: '#1e2b65',
                borderRadius: 16,
                padding: '20px',
                marginBottom: 16,
                color: '#fff',
              }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', marginBottom: 4 }}>
                  Welcome back,
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22, fontWeight: 700,
                  marginBottom: 16,
                }}>
                  {player?.name || 'Player'}
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Games', value: player?.games_played || 0 },
                    { label: 'Wins', value: player?.wins || 0 },
                    { label: 'Elo', value: Math.round(player?.elo || 800) },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: '12px 8px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20, fontWeight: 700,
                        color: '#C4A35A',
                      }}>{s.value}</div>
                      <div style={{
                        fontSize: 10, color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontFamily: 'sans-serif', marginTop: 2,
                      }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending confirmations banner */}
              {pendingCount > 0 && (
                <button
                  onClick={() => setTab('activity')}
                  style={{
                    width: '100%',
                    background: '#C4A35A',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    fontFamily: 'sans-serif',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#1e2b65', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                    }}>{pendingCount}</div>
                    <span style={{ color: '#1e2b65', fontSize: 14, fontWeight: 600 }}>
                      {pendingCount === 1 ? 'game needs' : 'games need'} your review
                    </span>
                  </div>
                  <span style={{ color: '#1e2b65', fontSize: 18 }}>→</span>
                </button>
              )}

              {/* Awaiting verification banner */}
              {awaitingCount > 0 && (
                <div
                  style={{
                    width: '100%',
                    background: '#ea580c',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    fontFamily: 'sans-serif',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}>{awaitingCount}</div>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                    {awaitingCount === 1 ? 'game' : 'games'} awaiting verification
                  </span>
                </div>
              )}

              {/* Quick action — log a game */}
              <button
                onClick={() => setTab('record')}
                style={{
                  width: '100%',
                  background: '#9f1239',
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px',
                  color: '#fff',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>+</span> Record a Game
              </button>

              {/* Quick links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Rankings', icon: '🏆', tab: 'rankings' },
                  { label: 'My Clubs', icon: '🏠', tab: 'clubs' },
                  { label: 'How It Works', icon: '📖', tab: 'howitworks' },
                  { label: 'Players', icon: '👥', tab: 'players' },
                ].map((link, i) => (
                  <button
                    key={i}
                    onClick={() => setTab(link.tab)}
                    style={{
                      background: 'white',
                      border: '0.5px solid #c8cdd6',
                      borderRadius: 12,
                      padding: '16px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontFamily: 'sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1e2b65',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{link.icon}</span>
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && session && (
            <div>
              <div style={{
                background: 'white',
                border: '0.5px solid #c8cdd6',
                borderRadius: 16,
                padding: '24px 20px',
                textAlign: 'center',
                marginBottom: 16,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#1e2b65', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                  margin: '0 auto 12px',
                }}>
                  {player?.name ? player.name.split(' ').map(n => n[0]).join('') : '?'}
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1e2b65' }}>
                  {player?.name || 'Player'}
                </div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>
                  {session?.user?.email}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20,
                  paddingTop: 16, borderTop: '0.5px solid #e8e8e4',
                }}>
                  {[
                    { label: 'Elo', value: Math.round(player?.elo || 800) },
                    { label: 'Wins', value: player?.wins || 0 },
                    { label: 'Losses', value: player?.losses || 0 },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1e2b65' }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                { label: 'My Clubs', tab: 'clubs' },
                { label: 'How It Works', tab: 'howitworks' },
                { label: 'Towns', tab: 'towns' },
                { label: 'Terms of Service', tab: 'terms' },
                { label: 'Privacy Policy', tab: 'privacy' },
              ].map((link, i) => (
                <button
                  key={i}
                  onClick={() => setTab(link.tab)}
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '0.5px solid #c8cdd6',
                    borderRadius: 10,
                    padding: '14px 16px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif',
                    fontSize: 14,
                    color: '#1e2b65',
                  }}
                >
                  {link.label}
                  <span style={{ color: '#888' }}>›</span>
                </button>
              ))}

              <button
                onClick={onSignOut}
                style={{
                  width: '100%',
                  background: 'white',
                  border: '0.5px solid #e8cdd6',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginTop: 8,
                  fontFamily: 'sans-serif',
                  fontSize: 14,
                  color: '#9f1239',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Sign Out
              </button>
            </div>
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
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '0.5px solid #c8cdd6',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: 6,
          zIndex: 200,
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.id
            const Icon = item.icon
            const showBadge = item.id === 'activity' && pendingCount > 0

            if (item.center) {
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  style={{
                    background: '#9f1239',
                    border: 'none',
                    width: 56, height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -20,
                    boxShadow: '0 4px 16px rgba(159,18,57,0.3)',
                    position: 'relative',
                  }}
                >
                  <Icon color="#fff" size={26} />
                </button>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '4px 12px 8px',
                  position: 'relative',
                  minWidth: 56,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon color={isActive ? '#1e2b65' : '#999'} size={22} />
                  {showBadge && (
                    <div style={{
                      position: 'absolute', top: -4, right: -8,
                      background: '#9f1239', color: '#fff',
                      fontSize: 9, fontWeight: 700,
                      minWidth: 16, height: 16, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'sans-serif',
                    }}>{pendingCount}</div>
                  )}
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'sans-serif',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#1e2b65' : '#999',
                }}>{item.label}</span>
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
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function RankingsIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function LogIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ActivityIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ProfileIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}