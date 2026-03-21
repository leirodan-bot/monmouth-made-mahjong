import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import logoHeader from '../assets/mahjrank/mahjranklogodark2400.png'
import NotificationBell from './NotificationBell'

export default function Header({ session, player, tab, setTab, refreshPlayer }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  async function handleSignOut() {
    setShowMenu(false)
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error)
  }

  const tabs = session
    ? ['rankings', 'howitworks', 'activity', 'players', 'clubs', 'record']
    : ['rankings', 'howitworks']

  const tabLabels = {
    rankings: 'Rankings',
    howitworks: 'How It Works',
    activity: 'Activity',
    players: 'Players',
    clubs: 'Clubs',
    record: 'Record'
  }

  return (
    <header style={{ background: '#0F172A', color: '#F8FAFC', position: 'relative', zIndex: 1000 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{ height: 44, overflow: 'hidden', borderRadius: 6, cursor: 'pointer' }}
              onClick={() => setTab('home')}
            >
              <img src={logoHeader} alt="MahjRank" style={{ height: 80, display: 'block' }} />
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: "'DM Sans', sans-serif", letterSpacing: '1.5px' }}>SEASON 1 · 2025–2026</div>
          </div>
          <div ref={menuRef} style={{ position: 'relative' }}>
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <NotificationBell player={player} onNavigate={setTab} refreshPlayer={refreshPlayer} />
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '0.5px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: '#ffffff',
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  {player?.name || 'My Account'} ▾
                </button>
                {showMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    background: 'white',
                    border: '0.5px solid #c8cdd6',
                    borderRadius: 8,
                    padding: 8,
                    minWidth: 180,
                    zIndex: 9999,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  }}>
                    <div style={{
                      fontSize: 12, color: '#888', fontFamily: "'DM Sans', sans-serif",
                      padding: '4px 8px',
                    }}>
                      {session.user.email}
                    </div>
                    <hr style={{ border: 'none', borderTop: '0.5px solid #e8e8e4', margin: '6px 0' }} />
                    {player?.role === 'admin' && (
                      <button
                        onClick={() => { setTab('admin'); setShowMenu(false) }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 8px', background: 'none', border: 'none',
                          fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#0F172A',
                          cursor: 'pointer', borderRadius: 4,
                        }}
                        onMouseEnter={e => e.target.style.background = '#f0f0f0'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 8px', background: 'none', border: 'none',
                        fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#DC2626',
                        cursor: 'pointer', borderRadius: 4,
                      }}
                      onMouseEnter={e => e.target.style.background = '#fff0f0'}
                      onMouseLeave={e => e.target.style.background = 'none'}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setTab('players')}
                style={{
                  background: '#DC2626', border: 'none', borderRadius: 8,
                  padding: '8px 16px', color: '#ffffff', fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.15)', alignItems: 'center' }}>
          {tabs.map(t => {
            const isRecord = t === 'record'
            const isActive = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={isRecord ? {
                  padding: '7px 18px',
                  margin: '6px 8px 6px 8px',
                  fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  background: isActive ? '#DC2626' : '#DC2626',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                } : {
                  padding: '10px 20px',
                  fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #DC2626' : '3px solid transparent',
                  cursor: 'pointer'
                }}
              >
                {isRecord ? '+ Record Game' : tabLabels[t]}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}