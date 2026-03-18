cat > src/components/ProfileSetup.jsx << 'EOF'
import { useState } from 'react'
import { supabase } from '../supabase'

export default function ProfileSetup({ session, onComplete }) {
  const [name, setName] = useState('')
  const [town, setTown] = useState('')
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!town) { setError('Please select your town'); return }
    setLoading(true)

    const { error: insertError } = await supabase.from('players').insert({
      user_id: session.user.id,
      name: name.trim(),
      email: session.user.email,
      town: town,
      elo: 800,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    onComplete()
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65', marginBottom: 4 }}>
          Complete your profile
        </h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginBottom: 20 }}>
          One last step — tell us your name and town to join the league.
        </p>

        {error && (
          <div style={{ background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b', fontFamily: 'sans-serif', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #c8cdd6', borderRadius: 8, fontSize: 13, fontFamily: 'sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Your Monmouth County town</label>
            <select
              value={town}
              onChange={e => setTown(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #c8cdd6', borderRadius: 8, fontSize: 13, fontFamily: 'sans-serif', boxSizing: 'border-box', background: 'white' }}
            >
              <option value="">Select your town...</option>
              {towns.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <p style={{ fontSize: 11, fontFamily: 'sans-serif', color: '#888', lineHeight: 1.5, marginBottom: 16, textAlign: 'center' }}>
            By continuing, you agree to our{' '}
            <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('terms') }} style={{ color: '#1e2b65', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" onClick={e => { e.preventDefault(); window.__mmjSetTab?.('privacy') }} style={{ color: '#1e2b65', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#1e2b65', color: '#ffffff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Please wait...' : 'Join the League'}
          </button>
        </form>
      </div>
    </div>
  )
}
EOF