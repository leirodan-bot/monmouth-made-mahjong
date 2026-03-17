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
import ActivityFeed from './components/ActivityFeed'
import logoLoading from './assets/logo-header.png'

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1e2b65' }}>
      <div style={{ textAlign: 'center', color: '#f4f4f2' }}>
        <img src={logoLoading} alt="Monmouth Made Mah Jongg" style={{ height: 48 }} />
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
        {tab === 'activity' && <ActivityFeed player={player} />}
        {!session && (tab === 'players' || tab === 'clubs' || tab === 'record') && (
          <Auth onAuth={() => {}} />
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontFamily: 'sans-serif', color: '#888', borderTop: '0.5px solid #c8cdd6', marginTop: 40 }}>
        Monmouth Made Mah Jongg · Season 1 · 2025–2026
      </footer>
    </div>
  )
}

export default App