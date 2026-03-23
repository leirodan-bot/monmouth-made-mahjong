import { useState } from 'react'
import { supabase } from '../supabase'

const C = {
  jade: '#065F46', jadeLt: '#059669', crimson: '#DC2626', gold: '#F59E0B', goldDk: '#D97706',
  midnight: '#0F172A', ink: '#1E293B', cloud: '#F8FAFC', slate: '#64748B', slateLt: '#94A3B8', border: '#E2E8F0',
}

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [town, setTown] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSignIn(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault(); setLoading(true); setError('')
    if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      // FIX (Mar 23 2026): Changed from .insert() to .upsert() to prevent duplicate player rows.
      // Root cause: users tapping "Create Account" multiple times while spinner was loading
      // created 20+ duplicate rows for the same user_id, which then broke profile loading.
      // DB-level safety net: UNIQUE constraint on players.user_id (added same day).
      // upsert updates the existing row if user_id already exists instead of failing.
      await supabase.from('players').upsert({ user_id: data.user.id, name: name.trim(), email, town: town || null, elo: 800 }, { onConflict: 'user_id' })
      setMessage('Account created! Please check your email to verify your account.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    // Google OAuth users who don't have a players row yet will be caught by
    // the ProfileSetup gate in App.jsx after redirect.
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  async function handleForgotPassword(e) {
    e.preventDefault(); setLoading(true); setError(''); setMessage('')
    if (!email.trim()) { setError('Please enter your email address first'); setLoading(false); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) { setError(error.message) } else { setMessage('Password reset link sent! Check your email.') }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
          {mode === 'signin' ? 'Welcome back to MahjRank' : 'Join MahjRank — track your Mahjong rating'}
        </p>

        {message && (
          <div style={{ background: 'rgba(6,95,70,0.06)', border: `1px solid rgba(6,95,70,0.15)`, borderLeft: `4px solid ${C.jade}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.jade, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{message}</div>
        )}
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.04)', border: `1px solid rgba(220,38,38,0.15)`, borderLeft: `4px solid ${C.crimson}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.crimson, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{error}</div>
        )}

        <button onClick={handleGoogle} style={{
          width: '100%', background: 'white', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px', fontSize: 13,
          fontFamily: "'DM Sans', sans-serif", color: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, cursor: 'pointer'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 11, color: C.slateLt, fontFamily: "'DM Sans', sans-serif" }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
          {mode === 'signup' && (
            <>
              <div style={{ marginBottom: 12 }}>
                {/* WARNING: Do not change this back to "Full name" — display names are public on leaderboards.
                    The ProfileSetup.jsx screen must also say "Display name" to stay consistent. */}
                <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Display name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MahjQueen42" required />
                <div style={{ fontSize: 10, color: C.crimson, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>⚠️ This is your public display name. Do NOT use your real name.</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Town (optional)</label>
                <input value={town} onChange={e => setTown(e.target.value)} placeholder="e.g. Red Bank, NJ" />
              </div>
            </>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" required />
          </div>
          <div style={{ marginBottom: mode === 'signin' ? 8 : 20 }}>
            <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <span onClick={handleForgotPassword} style={{ fontSize: 12, color: C.jade, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600 }}>
                Forgot password?
              </span>
            </div>
          )}
          {mode === 'signup' && (
            <p style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: C.slate, lineHeight: 1.5, marginBottom: 16, textAlign: 'center' }}>
              By creating an account, you agree to our{' '}
              <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('terms') }} style={{ color: C.midnight, fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('privacy') }} style={{ color: C.midnight, fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', background: C.crimson, color: '#ffffff', border: 'none', borderRadius: 8, padding: '11px',
            fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.2)'
          }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.slate }}>
          {mode === 'signin' ? (
            <>Don't have an account?{' '}<span onClick={() => setMode('signup')} style={{ color: C.jade, fontWeight: 700, cursor: 'pointer' }}>Sign up</span></>
          ) : (
            <>Already have an account?{' '}<span onClick={() => setMode('signin')} style={{ color: C.jade, fontWeight: 700, cursor: 'pointer' }}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  )
}
