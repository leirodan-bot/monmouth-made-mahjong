import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Header from './components/Header'
import Rankings from './components/Rankings'
import Towns from './components/Towns'
import Players from './components/Players'
import Clubs from './components/Clubs'
import RecordMatch from './components/RecordMatch'
import HowItWorks from './components/HowItWorks'

function App() {
  const [session, setSession] = useState(null)
  const [player, setPlayer] = useState(null)
  const [tab, setTab] = useState('rankings')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchPlayer(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchPlayer(session.user.id)
      else { setPlayer(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPlayer(userId) {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single()
    setPlayer(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a2744' }}>
      <div style={{ textAlign: 'center', color: '#f4f4f2' }}>
        <svg width="80" height="80" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
          <circle cx="130" cy="130" r="122" fill="#1a2744" stroke="#f4f4f2" strokeWidth="3"/>
          <circle cx="130" cy="130" r="112" fill="#1a2744" stroke="#f4f4f2" strokeWidth="1.2"/>
          <rect x="54" y="96" width="58" height="78" rx="7" fill="#f4f4f2"/>
          <rect x="58" y="100" width="50" height="70" rx="5" fill="white"/>
          <text x="83" y="148" fontSize="36" fontFamily="Georgia,serif" fontWeight="700" fill="#1a2744" textAnchor="middle">M</text>
          <rect x="148" y="96" width="58" height="78" rx="7" fill="#f4f4f2"/>
          <rect x="152" y="100" width="50" height="70" rx="5" fill="white"/>
          <path d="M157 118 Q163 110 169 118 Q175 126 181 118 Q187 110 193 118" stroke="#1a2744" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
          <path d="M157 130 Q163 122 169 130 Q175 138 181 130 Q187 122 193 130" stroke="#1a2744" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
          <path d="M157 142 Q163 134 169 142 Q175 150 181 142 Q187 134 193 142" stroke="#9f1239" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        </svg>
        <div style={{ marginTop: 16, fontSize: 14, fontFamily: 'sans-serif', opacity: 0.7 }}>Loading...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f2' }}>
      <Header session={session} player={player} tab={tab} setTab={setTab} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {tab === 'rankings' && <Rankings session={session} player={player} />}
        {tab === 'towns' && <Towns />}
        {tab === 'players' && session && <Players session={session} player={player} />}
        {tab === 'clubs' && session && <Clubs session={session} player={player} />}
        {tab === 'record' && session && <RecordMatch session={session} player={player} />}
        {tab === 'howitworks' && <HowItWorks />}
        {!session && (tab === 'players' || tab === 'clubs' || tab === 'record') && (
          <Auth onAuth={() => {}} />
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontFamily: 'sans-serif', color: '#888', borderTop: '0.5px solid #c8cdd6', marginTop: 40 }}>
        Monmouth Made Mah Jongg · Season 1 · 2025–2026 ·{' '}
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setTab('howitworks')}>How It Works</span>
      </footer>
    </div>
  )
}

export default App