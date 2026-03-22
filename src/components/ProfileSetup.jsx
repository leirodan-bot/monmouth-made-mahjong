import { useState } from 'react'
import { supabase } from '../supabase'

const C = {
  jade: '#065F46', crimson: '#DC2626', midnight: '#0F172A', cloud: '#F8FAFC', slate: '#64748B', border: '#E2E8F0',
}

export default function ProfileSetup({ session, onComplete }) {
  const [name, setName] = useState('')
  const [town, setTown] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (!name.trim()) { setError('Please enter your name'); return }
    setLoading(true)
    const { error: insertError } = await supabase.from('players').insert({ user_id: session.user.id, name: name.trim(), email: session.user.email, town: town.trim() || null, elo: 800 })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    onComplete()
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Complete your profile</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>One last step — tell us your name to get started on MahjRank.</p>
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.04)', border: `1px solid rgba(220,38,38,0.15)`, borderLeft: `4px solid ${C.crimson}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.crimson, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Town (optional)</label>
            <input value={town} onChange={e => setTown(e.target.value)} placeholder="e.g. Red Bank, NJ" />
          </div>
          <p style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: C.slate, lineHeight: 1.5, marginBottom: 16, textAlign: 'center' }}>
            By continuing, you agree to our{' '}
            <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('terms') }} style={{ color: C.midnight, fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('privacy') }} style={{ color: C.midnight, fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
          <button type="submit" disabled={loading} style={{ width: '100%', background: C.crimson, color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}>
            {loading ? 'Please wait...' : 'Join MahjRank'}
          </button>
        </form>
      </div>
    </div>
  )
}
