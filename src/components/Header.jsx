import { useState } from 'react'
import { supabase } from '../supabase'
import logoWhite from '../assets/logo-white.svg'

export default function Header({ session, player, tab, setTab }) {
  const [showMenu, setShowMenu] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    setShowMenu(false)
  }

  const tabs = session
    ? ['rankings', 'towns', 'players', 'clubs', 'record']
    : ['rankings', 'towns']

  const tabLabels = {
    rankings: 'Rankings',
    towns: 'Towns',
    players: 'Players',
    clubs: 'Clubs',
    record: 'Record'
  }

  return (
    <header style={{ background: '#1e2b65', color: '#f4f4f2' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={logoWhite} alt="Monmouth Made Mah Jongg" style={{ height: 38 }} />
            <div style={{ fontSize: 11, color: '#a0b0c8', fontFamily: 'sans-serif', letterSpacing: '1.5px' }}>COUNTY LEAGUE · SEASON 1 · 2025–2026</div>
          </div>
          <div style={{ position: 'relative' }}>
            {session ? (
              <div>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', color: '#ffffff', fontSize: 12, fontFamily: 'sans-serif' }}
                >
                  {player?.name || 'My Account'} ▾
                </button>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 8, padding: 8, minWidth: 160, zIndex: 100 }}>
                    <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', padding: '4px 8px' }}>{session.user.email}</div>
                    <hr style={{ border: 'none', borderTop: '0.5px solid #e8e8e4', margin: '6px 0' }}/>
                    {player?.role === 'admin' && (
                      <button onClick={() => { setTab('admin'); setShowMenu(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', fontSize: 12, fontFamily: 'sans-serif', color: '#1e2b65', cursor: 'pointer' }}>Admin Panel</button>
                    )}
                    <button onClick={handleSignOut} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', fontSize: 12, fontFamily: 'sans-serif', color: '#9f1239', cursor: 'pointer' }}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setTab('players')}
                style={{ background: '#9f1239', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#ffffff', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700 }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none',
                borderBottom: tab === t ? '3px solid #9f1239' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              {tabLabels[t]}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}