import { useState } from 'react'
import { supabase } from '../supabase'
import { C, fonts, shadows } from '../theme'

// ProfileSetup is shown after Google OAuth sign-in when no players row exists yet.
// It's gated in App.jsx: session exists but fetchPlayer() returns null → show this form.
// Also shown if a player row exists but name is still the default "player".
export default function ProfileSetup({ session, player, onComplete }) {
  const [name, setName] = useState(player?.name || session?.user?.user_metadata?.full_name || '')
  const [town, setTown] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (!name.trim()) { setError('Please enter a display name'); return }
    setLoading(true)
    // FIX (Mar 23 2026): Changed from .insert() to .upsert() to prevent duplicate player rows.
    // Root cause: users tapping submit multiple times while spinner was loading created 20+ rows.
    // DB-level safety net: UNIQUE constraint on players.user_id (added same day).
    // upsert updates the existing row if user_id already exists instead of failing.
    const { error: upsertError } = await supabase.from('players').upsert({ user_id: session.user.id, name: name.trim(), email: session.user.email, town: town.trim() || null, elo: 800 }, { onConflict: 'user_id' })
    if (upsertError) { setError(upsertError.message); setLoading(false); return }
    onComplete()
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Complete your profile</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>One last step — choose a display name to get started on MahjRank.</p>
        {error && (
          <div style={{ background: 'rgba(225,29,72,0.04)', border: `1px solid rgba(225,29,72,0.15)`, borderLeft: `4px solid ${C.crimson}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.crimson, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            {/* WARNING: Do not change this back to "Full name" — display names are public on leaderboards.
                Auth.jsx signup must also say "Display name" to stay consistent.
                FIX (Mar 23 2026): Was "Full name" with placeholder "Jane Smith", which encouraged
                users to enter real names that then appeared publicly on the leaderboard. */}
            <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MahjQueen42" required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
            <div style={{ fontSize: 10, color: C.crimson, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>⚠️ This is your public display name. Do NOT use your real name.</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Town (optional)</label>
            <input value={town} onChange={e => setTown(e.target.value)} placeholder="e.g. Red Bank, NJ" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
          </div>
          <p style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: C.slate, lineHeight: 1.5, marginBottom: 16, textAlign: 'center' }}>
            By continuing, you agree to our{' '}
            <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('terms') }} style={{ color: C.midnight, fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('privacy') }} style={{ color: C.midnight, fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
          <button type="submit" disabled={loading} style={{ width: '100%', background: C.crimson, color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(225,29,72,0.2)' }}>
            {loading ? 'Please wait...' : 'Join MahjRank'}
          </button>
        </form>
      </div>
    </div>
  )
}
