import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Header from './components/Header'
import Homepage from './components/Homepage'
import MobileShell from './components/MobileShell'
import Rankings from './components/Rankings'
import Towns from './components/Towns'
import Players from './components/Players'
import Clubs from './components/Clubs'
import RecordMatch from './components/RecordMatch'
import HowItWorks from './components/HowItWorks'
import ActivityFeed from './components/ActivityFeed'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import CookiePolicy from './components/CookiePolicy'
import CookieConsent from './components/CookieConsent'
import InstallPrompt from './components/InstallPrompt'
import logoLoading from './assets/logo-header.png'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // Check if PWA standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    // Check screen width
    const isNarrow = window.innerWidth <= 768
    return isStandalone || isNarrow
  })

  useEffect(() => {
    function check() {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
      const isNarrow = window.innerWidth <= 768
      setIsMobile(isStandalone || isNarrow)
    }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

function App() {
  const [session, setSession] = useState(null)
  const [player, setPlayer] = useState(null)
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  window.__mmjSetTab = setTab

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchPlayer(session.user.id)
        if (!isMobile) setTab(prev => prev === 'home' ? 'rankings' : prev)
      }
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchPlayer(session.user.id)
        if (!isMobile) setTab(prev => prev === 'home' ? 'rankings' : prev)
      }
      else { setPlayer(null); setLoading(false); setTab('home') }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  async function fetchPlayer(userId) {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single()
    setPlayer(data)
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1e2b65' }}>
      <div style={{ textAlign: 'center', color: '#f4f4f2' }}>
        <img src={logoLoading} alt="Monmouth Made Mah Jongg" style={{ height: 48 }} />
        <div style={{ marginTop: 16, fontSize: 14, fontFamily: 'sans-serif', opacity: 0.7 }}>Loading...</div>
      </div>
    </div>
  )

  // ===== MOBILE / PWA LAYOUT =====
  if (isMobile) {
    return <MobileShell session={session} player={player} onSignOut={handleSignOut} />
  }

  // ===== DESKTOP LAYOUT =====

  // Homepage for non-logged-in desktop users
  if (tab === 'home' && !session) {
    return (
      <>
        <Homepage setTab={setTab} />
        <InstallPrompt />
      </>
    )
  }

  // Logged-in desktop users who somehow land on 'home' go to rankings
  if (tab === 'home' && session) {
    setTab('rankings')
    return null
  }

  const isLegalPage = tab === 'terms' || tab === 'privacy' || tab === 'cookies'

  return (
    <div className="floral-bg" style={{ minHeight: '100vh' }}>
      <Header session={session} player={player} tab={tab} setTab={setTab} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {tab === 'rankings' && <Rankings session={session} player={player} />}
        {tab === 'towns' && <Towns />}
        {tab === 'players' && session && <Players session={session} player={player} />}
        {tab === 'clubs' && session && <Clubs session={session} player={player} />}
        {tab === 'record' && session && <RecordMatch session={session} player={player} />}
        {tab === 'howitworks' && <HowItWorks />}
        {tab === 'activity' && <ActivityFeed player={player} />}
        {tab === 'terms' && <TermsOfService setTab={setTab} />}
        {tab === 'privacy' && <PrivacyPolicy setTab={setTab} />}
        {tab === 'cookies' && <CookiePolicy setTab={setTab} />}
        {!session && (tab === 'players' || tab === 'clubs' || tab === 'record') && (
          <Auth onAuth={() => {}} />
        )}
      </main>

      <footer style={{
        textAlign: 'center', padding: '24px 16px', fontSize: 11,
        fontFamily: 'sans-serif', color: '#888',
        borderTop: '0.5px solid #c8cdd6', marginTop: 40
      }}>
        <div style={{ marginBottom: 8 }}>
          Monmouth Made Mah Jongg™ · Season 1 · 2025–2026
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('terms')}
            style={{
              background: 'none', border: 'none', fontSize: 11, fontFamily: 'sans-serif',
              color: isLegalPage && tab === 'terms' ? '#1e2b65' : '#888',
              textDecoration: 'underline', cursor: 'pointer', padding: 0,
              fontWeight: tab === 'terms' ? 600 : 400
            }}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setTab('privacy')}
            style={{
              background: 'none', border: 'none', fontSize: 11, fontFamily: 'sans-serif',
              color: isLegalPage && tab === 'privacy' ? '#1e2b65' : '#888',
              textDecoration: 'underline', cursor: 'pointer', padding: 0,
              fontWeight: tab === 'privacy' ? 600 : 400
            }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('cookies')}
            style={{
              background: 'none', border: 'none', fontSize: 11, fontFamily: 'sans-serif',
              color: isLegalPage && tab === 'cookies' ? '#1e2b65' : '#888',
              textDecoration: 'underline', cursor: 'pointer', padding: 0,
              fontWeight: tab === 'cookies' ? 600 : 400
            }}
          >
            Cookie Policy
          </button>
        </div>
      </footer>

      <CookieConsent setTab={setTab} />
      <InstallPrompt />
    </div>
  )
}

export default App