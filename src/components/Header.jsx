import { useState } from 'react'
import { supabase } from '../supabase'

const Logo = () => (
  <svg width="72" height="72" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="topArc" d="M 35,130 A 95,95 0 0,1 225,130"/>
      <path id="botArc" d="M 50,175 A 95,95 0 0,0 210,175"/>
    </defs>
    <circle cx="130" cy="130" r="122" fill="#1a2744" stroke="#ffffff" strokeWidth="3"/>
    <circle cx="130" cy="130" r="112" fill="#1a2744" stroke="#ffffff" strokeWidth="1.2"/>
    <rect x="54" y="96" width="58" height="78" rx="7" fill="#f4f4f2"/>
    <rect x="58" y="100" width="50" height="70" rx="5" fill="white"/>
    <text x="83" y="148" fontSize="36" fontFamily="Georgia,serif" fontWeight="700" fill="#1a2744" textAnchor="middle">M</text>
    <rect x="148" y="96" width="58" height="78" rx="7" fill="#f4f4f2"/>
    <rect x="152" y="100" width="50" height="70" rx="5" fill="white"/>
    <path d="M157 118 Q163 110 169 118 Q175 126 181 118 Q187 110 193 118" stroke="#1a2744" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M157 130 Q163 122 169 130 Q175 138 181 130 Q187 122 193 130" stroke="#1a2744" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M157 142 Q163 134 169 142 Q175 150 181 142 Q187 134 193 142" stroke="#9f1239" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <text fontFamily="Georgia,serif" fontWeight="700" fill="white" fontSize="13.5">
      <textPath xlinkHref="#topArc" startOffset="50%" textAnchor="middle">MONMOUTH MADE</textPath>
    </text>
    <text fontFamily="Georgia,serif" fontWeight="700" fill="white" fontSize="13.5">
      <textPath xlinkHref="#botArc" startOffset="50%" textAnchor="middle">MAH JONGG</textPath>
    </text>
    <rect x="127" y="14" width="6" height="6" fill="white" transform="rotate(45 130 17)" opacity="0.5"/>
    <rect x="127" y="241" width="6" height="6" fill="white" transform="rotate(45 130 244)" opacity="0.5"/>
  </svg>
)

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
    <header style={{ background: '#1a2744', color: '#f4f4f2' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Logo />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', fontFamily: 'Playfair Display, serif' }}>Monmouth Made Mah Jongg</div>
              <div style={{ fontSize: 11, color: '#a0b0c8', fontFamily: 'sans-serif', letterSpacing: '1.5px', marginTop: 3 }}>COUNTY LEAGUE · SEASON 1 · 2025–2026</div>
            </div>
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
                      <button onClick={() => { setTab('admin'); setShowMenu(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'none', border: 'none', fontSize: 12, fontFamily: 'sans-serif', color: '#1a2744', cursor: 'pointer' }}>Admin Panel</button>
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