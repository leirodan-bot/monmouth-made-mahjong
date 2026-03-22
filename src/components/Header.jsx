import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import logoHeader from '../assets/mahjrank/mahjranklogotransparent2400.png'
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
    <header style={{ background: 'white', color: '#0F172A', position: 'relative', zIndex: 1000, borderBottom: '1px solid #E2E8F0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setTab('home')}
            >
              <img src={logoHeader} alt="MahjRank" style={{ height: 44, display: 'block' }} />
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', fontWeight: 500 }}>SEASON 1</div>
          </div>
          <div ref={menuRef} style={{ position: 'relative' }}>
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <NotificationBell player={player} onNavigate={setTab} refreshPlayer={refreshPlayer} />
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '7px 14px',
                    color: '#0F172A',
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
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
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: 8,
                    minWidth: 180,
                    zIndex: 9999,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{
                      fontSize: 12, color: '#94A3B8', fontFamily: "'DM Sans', sans-serif",
                      padding: '4px 8px',
                    }}>
                      {session.user.email}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '6px 0' }} />
                    {player?.role === 'admin' && (
                      <button
                        onClick={() => { setTab('admin'); setShowMenu(false) }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 8px', background: 'none', border: 'none',
                          fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#0F172A',
                          cursor: 'pointer', borderRadius: 6,
                        }}
                        onMouseEnter={e => e.target.style.background = '#F8FAFC'}
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
                        cursor: 'pointer', borderRadius: 6,
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(220,38,38,0.04)'}
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
        <nav style={{ display: 'flex', gap: 0, borderTop: '1px solid #E2E8F0', alignItems: 'center' }}>
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
                  background: '#DC2626',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
                } : {
                  padding: '10px 20px',
                  fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#065F46' : '#64748B',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #065F46' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
              >
                {isRecord ? '+ Record Game' : tabLabels[t]}
              </button>
            )
          })}
        </nav>
      </div>
      {/* Thin gradient accent */}
      <div style={{ height: 2, background: 'linear-gradient(to right, #065F46, #059669, #DC2626)', opacity: 0.4 }} />
    </header>
  )
}