import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { native } from './native'
import { Capacitor } from '@capacitor/core'
import Auth from './components/Auth'
import Header from './components/Header'
import Homepage from './components/Homepage'
import MobileShell from './components/MobileShell'
import Rankings from './components/Rankings'
import Towns from './components/Towns'
import Players from './components/Players'
import Clubs from './components/Clubs'
import Social from './components/Social'
import RecordMatch from './components/RecordMatch'
import HowItWorks from './components/HowItWorks'
import ActivityFeed from './components/ActivityFeed'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import CookiePolicy from './components/CookiePolicy'
import CookieConsent from './components/CookieConsent'
import ProfileSetup from './components/ProfileSetup'
import InstallPrompt from './components/InstallPrompt'
import logoLoading from './assets/mahjrank/mahjranklogomonowhite1800.png'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // Capacitor native is always "mobile"
    if (native.isNative) return true
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    const isNarrow = window.innerWidth <= 768
    return isStandalone || isNarrow
  })

  useEffect(() => {
    if (native.isNative) return // Always mobile on native
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
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
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

  // ── Native iOS initialization ──
  useEffect(() => {
    if (!native.isNative) return

    // Set status bar to light text (for dark header backgrounds)
    native.statusBar.setLight()

    // Hide splash screen once React has mounted
    native.splash.hide()

    // Handle OAuth deep link callback from Safari
    async function handleOAuthUrl(url) {
      if (!url || !url.includes('login-callback')) return false
      console.log('OAuth callback URL received:', url)

      try {
        // Handle PKCE flow: ?code=...
        const queryString = url.split('?')[1]?.split('#')[0]
        if (queryString) {
          const params = new URLSearchParams(queryString)
          const code = params.get('code')
          if (code) {
            console.log('PKCE code found, exchanging...')
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) console.error('Code exchange failed:', error.message)
            return true
          }
        }

        // Handle implicit flow: #access_token=...
        const hashPart = url.split('#')[1]
        if (hashPart) {
          const params = new URLSearchParams(hashPart)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            console.log('Tokens found, setting session...')
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) console.error('Set session failed:', error.message)
            return true
          }
        }
        console.log('No tokens or code found in URL')
      } catch (err) {
        console.error('OAuth URL handling error:', err)
      }
      return false
    }

    // Set up deep link listener (for when app is in background)
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', ({ url }) => {
        handleOAuthUrl(url)
      })

      // Also check if the app was launched via URL (app was killed)
      App.getLaunchUrl().then((result) => {
        if (result?.url) {
          handleOAuthUrl(result.url)
        }
      })
    })
  }, [])

  // ── Register push notifications once we have a logged-in player ──
  useEffect(() => {
    if (!native.isNative || !session || !player) return

    async function registerPush() {
      const token = await native.push.register()
      if (token) {
        // Store the APNs device token in the player's record
        await supabase.from('players').update({ push_token: token }).eq('id', player.id)
      }

      // Handle taps on notifications — navigate to the relevant tab
      native.push.onTapped(({ data }) => {
        if (data?.tab) setTab(data.tab)
      })
    }

    registerPush()
  }, [session, player?.id])

  // ── Auto-verify stale matches (client-side fallback for pg_cron) ──
  useEffect(() => {
    if (!session) return
    supabase.rpc('auto_verify_old_games').then(({ data, error }) => {
      if (error) console.warn('Auto-verify RPC failed:', error.message)
      else if (data > 0) console.log(`Auto-verified ${data} stale matches`)
    })
  }, [session])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  async function refreshPlayer() {
    if (session?.user?.id) {
      await fetchPlayer(session.user.id)
    }
  }

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1C1917' }}>
      <div style={{ textAlign: 'center', color: '#FAFAF9' }}>
        <img src={logoLoading} alt="MahjRank" style={{ height: 48 }} />
        <div style={{ marginTop: 16, fontSize: 14, fontFamily: "'DM Sans', sans-serif", opacity: 0.7 }}>Loading...</div>
      </div>
    </div>
  )

  if (session && !player) {
    return <ProfileSetup session={session} onComplete={() => fetchPlayer(session.user.id)} />
  }

  if (isMobile) {
    return <MobileShell session={session} player={player} onSignOut={handleSignOut} refreshPlayer={refreshPlayer} />
  }

  if (tab === 'home' && !session) {
    return (
      <>
        <Homepage setTab={setTab} />
        <InstallPrompt />
      </>
    )
  }

  if (tab === 'home' && session) {
    setTab('rankings')
    return null
  }

  const isLegalPage = tab === 'terms' || tab === 'privacy' || tab === 'cookies'

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      <Header session={session} player={player} tab={tab} setTab={setTab} refreshPlayer={refreshPlayer} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {tab === 'rankings' && <Rankings session={session} player={player} onPlayerClick={(id) => { setSelectedPlayerId(id); setTab('social') }} />}
        {tab === 'towns' && <Towns />}
        {tab === 'social' && session && <Social session={session} player={player} initialPlayerId={selectedPlayerId} onClearInitial={() => setSelectedPlayerId(null)} />}
        {tab === 'players' && session && <Players session={session} player={player} initialPlayerId={selectedPlayerId} onClearInitial={() => setSelectedPlayerId(null)} />}
        {tab === 'clubs' && session && <Clubs session={session} player={player} />}
        {tab === 'record' && session && <RecordMatch session={session} player={player} refreshPlayer={refreshPlayer} onDone={() => setTab('rankings')} />}
        {tab === 'howitworks' && <HowItWorks />}
        {tab === 'activity' && <ActivityFeed player={player} />}
        {tab === 'terms' && <TermsOfService setTab={setTab} />}
        {tab === 'privacy' && <PrivacyPolicy setTab={setTab} />}
        {tab === 'cookies' && <CookiePolicy setTab={setTab} />}
        {!session && (tab === 'social' || tab === 'players' || tab === 'clubs' || tab === 'record') && (
          <Auth onAuth={() => {}} />
        )}
      </main>

      <footer style={{
        textAlign: 'center', padding: '24px 16px', fontSize: 11,
        fontFamily: "'DM Sans', sans-serif", color: '#A8A29E',
        borderTop: '0.5px solid #D6D3D1', marginTop: 40
      }}>
        <div style={{ marginBottom: 8 }}>
          MahjRank™ · Season 1 · 2025–2026
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('terms')}
            style={{
              background: 'none', border: 'none', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              color: isLegalPage && tab === 'terms' ? '#1C1917' : '#A8A29E',
              textDecoration: 'underline', cursor: 'pointer', padding: 0,
              fontWeight: tab === 'terms' ? 600 : 400
            }}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setTab('privacy')}
            style={{
              background: 'none', border: 'none', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              color: isLegalPage && tab === 'privacy' ? '#1C1917' : '#A8A29E',
              textDecoration: 'underline', cursor: 'pointer', padding: 0,
              fontWeight: tab === 'privacy' ? 600 : 400
            }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('cookies')}
            style={{
              background: 'none', border: 'none', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              color: isLegalPage && tab === 'cookies' ? '#1C1917' : '#A8A29E',
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
