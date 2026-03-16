import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Clubs({ session, player }) {
  const [clubs, setClubs] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [meetDay, setMeetDay] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: clubData }, { data: playerData }] = await Promise.all([
      supabase.from('organizations').select('*').order('name'),
      supabase.from('players').select('id, name, elo, org')
    ])
    setClubs(clubData || [])
    setPlayers(playerData || [])
    setLoading(false)
  }

  async function handleAddClub(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('organizations').insert({
      name: name.trim(),
      location: location.trim(),
      meet_day: meetDay.trim()
    })
    if (!error) {
      setMessage('Club added!')
      setName(''); setLocation(''); setMeetDay('')
      setShowForm(false)
      fetchData()
    }
    setSaving(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif', color: '#888' }}>Loading clubs...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>Clubs</h2>
          <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Active mahjong clubs in Monmouth County</p>
        </div>
        {player?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: '#1a2744', color: '#f4f4f2', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700 }}>
            {showForm ? 'Cancel' : '+ Add Club'}
          </button>
        )}
      </div>

      {message && (
        <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46', fontFamily: 'sans-serif', marginBottom: 16 }}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddClub} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Club name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shore Tiles" required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Red Bank Library" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Meeting day(s)</label>
              <input value={meetDay} onChange={e => setMeetDay(e.target.value)} placeholder="e.g. Tuesdays" />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ background: '#1a2744', color: '#f4f4f2', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700 }}>
            {saving ? 'Saving...' : 'Add Club'}
          </button>
        </form>
      )}

      {clubs.length === 0 ? (
        <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', fontFamily: 'sans-serif' }}>No clubs yet — ask your admin to add one.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {clubs.map(club => {
            const clubPlayers = players.filter(p => p.org === club.name)
            const avgElo = clubPlayers.length > 0
              ? Math.round(clubPlayers.reduce((s, p) => s + p.elo, 0) / clubPlayers.length)
              : 0
            return (
              <div key={club.id} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>{club.name}</div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif' }}>{club.location}</div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginBottom: 12 }}>Meets: {club.meet_day || 'TBD'}</div>
                <div style={{ borderTop: '0.5px solid #e8e8e4', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif' }}>Players</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2744' }}>{clubPlayers.length}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif' }}>Avg Elo</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#9f1239', fontFamily: 'Playfair Display, serif' }}>{avgElo || '—'}</div>
                  </div>
                </div>
                {clubPlayers.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {clubPlayers.sort((a, b) => b.elo - a.elo).map(p => (
                      <span key={p.id} style={{ fontSize: 10, background: '#f4f4f2', color: '#555', padding: '2px 8px', borderRadius: 20, fontFamily: 'sans-serif' }}>
                        {p.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}