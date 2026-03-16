import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [town, setTown] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const towns = [
    'Aberdeen', 'Allenhurst', 'Allentown', 'Atlantic Highlands', 'Avon-by-the-Sea',
    'Belford', 'Belmar', 'Bradley Beach', 'Brielle', 'Colts Neck',
    'Deal', 'Eatontown', 'Englishtown', 'Fair Haven', 'Farmingdale',
    'Freehold', 'Freehold Township', 'Highlands', 'Holmdel', 'Howell',
    'Interlaken', 'Keansburg', 'Keyport', 'Lake Como', 'Little Silver',
    'Loch Arbour', 'Long Branch', 'Manalapan', 'Manasquan', 'Marlboro',
    'Matawan', 'Middletown', 'Millstone', 'Monmouth Beach', 'Monmouth Junction',
    'Neptune', 'Neptune City', 'Ocean Grove', 'Oceanport', 'Red Bank',
    'Roosevelt', 'Rumson', 'Sea Bright', 'Sea Girt', 'Shrewsbury',
    'Spring Lake', 'Spring Lake Heights', 'Tinton Falls', 'Upper Freehold',
    'Wall Township', 'West Long Branch'
  ]

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
    if (!town) { setError('Please select your town'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('players').insert({
        user_id: data.user.id,
        name: name.trim(),
        email: email,
        town: town,
        elo: 800,
      })
      setMessage('Account created! Please check your email to verify your account.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginBottom: 20 }}>
          {mode === 'signin' ? 'Welcome back to Monmouth Made Mahjong' : 'Join the Monmouth County Mahjong League'}
        </p>

        {message && (
          <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', marginBottom: 16 }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b', fontFamily: 'sans-serif', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          style={{ width: '100%', background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 8, padding: '10px', fontSize: 13, fontFamily: 'sans-serif', color: '#1a2744', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, height: '0.5px', background: '#c8cdd6' }}/>
          <span style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#c8cdd6' }}/>
        </div>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
          {mode === 'signup' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Your Monmouth County town</label>
                <select value={town} onChange={e => setTown(e.target.value)} required>
                  <option value="">Select your town...</option>
                  {towns.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#1a2744', color: '#ffffff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, fontFamily: 'sans-serif', color: '#888' }}>
          {mode === 'signin' ? (
            <>Don't have an account?{' '}<span onClick={() => setMode('signup')} style={{ color: '#1a2744', fontWeight: 700, cursor: 'pointer' }}>Sign up</span></>
          ) : (
            <>Already have an account?{' '}<span onClick={() => setMode('signin')} style={{ color: '#1a2744', fontWeight: 700, cursor: 'pointer' }}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  )
}