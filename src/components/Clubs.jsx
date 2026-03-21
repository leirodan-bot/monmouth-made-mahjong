import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Clubs({ session, player }) {
  const [clubs, setClubs] = useState([])
  const [players, setPlayers] = useState([])
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClub, setEditingClub] = useState(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [meetDay, setMeetDay] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedClub, setSelectedClub] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: clubData }, { data: playerData }, { data: memberData }] = await Promise.all([
      supabase.from('organizations').select('*').order('name'),
      supabase.from('players').select('id, name, elo, org, user_id, role'),
      supabase.from('club_members').select('*')
    ])
    setClubs(clubData || [])
    setPlayers(playerData || [])
    setMemberships(memberData || [])
    setLoading(false)
  }

  function isLeagueAdmin() { return player?.role === 'admin' }
  function isClubOrganizer(club) { return isLeagueAdmin() || club.created_by === player?.id }
  function myMembership(clubId) { return memberships.find(m => m.club_id === clubId && m.player_id === player?.id) }

  async function handleSaveClub(e) {
    e.preventDefault(); setSaving(true)
    if (editingClub) {
      await supabase.from('organizations').update({ name: name.trim(), location: location.trim(), meet_day: meetDay.trim() }).eq('id', editingClub.id)
      setMessage('Club updated!')
    } else {
      await supabase.from('organizations').insert({ name: name.trim(), location: location.trim(), meet_day: meetDay.trim(), created_by: player?.id })
      setMessage('Club added!')
    }
    setName(''); setLocation(''); setMeetDay(''); setShowForm(false); setEditingClub(null); fetchData(); setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleDeleteClub(clubId) {
    if (!window.confirm('Delete this club? This cannot be undone.')) return
    await supabase.from('organizations').delete().eq('id', clubId); setSelectedClub(null); fetchData()
  }

  async function handleRequestJoin(clubId) {
    await supabase.from('club_members').insert({ club_id: clubId, player_id: player?.id, status: 'pending' })
    setMessage('Join request sent!'); fetchData(); setTimeout(() => setMessage(''), 3000)
  }

  async function handleApproveMember(membershipId, playerId, clubName) {
    await supabase.from('club_members').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', membershipId)
    await supabase.from('players').update({ org: clubName }).eq('id', playerId); fetchData()
  }

  async function handleRejectMember(membershipId) { await supabase.from('club_members').delete().eq('id', membershipId); fetchData() }
  async function handleMakeOrganizer(membershipId) { await supabase.from('club_members').update({ role: 'organizer' }).eq('id', membershipId); fetchData() }
  async function handleRemoveMember(membershipId, playerId) {
    await supabase.from('club_members').delete().eq('id', membershipId)
    await supabase.from('players').update({ org: null }).eq('id', playerId); fetchData()
  }

  function startEdit(club) { setEditingClub(club); setName(club.name); setLocation(club.location || ''); setMeetDay(club.meet_day || ''); setShowForm(true) }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: '#888' }}>Loading clubs...</div>

  if (selectedClub) {
    const club = clubs.find(c => c.id === selectedClub)
    if (!club) { setSelectedClub(null); return null }
    const clubMemberships = memberships.filter(m => m.club_id === club.id)
    const approved = clubMemberships.filter(m => m.status === 'approved')
    const pending = clubMemberships.filter(m => m.status === 'pending')
    const canManage = isClubOrganizer(club)

    return (
      <div>
        <button onClick={() => setSelectedClub(null)} style={{ background: 'none', border: '0.5px solid #c8cdd6', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#0F172A', marginBottom: 16, cursor: 'pointer' }}>
          ← Back to clubs
        </button>
        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{club.name}</h2>
              <div style={{ fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{club.location}</div>
              <div style={{ fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>Meets: {club.meet_day || 'TBD'}</div>
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setSelectedClub(null); startEdit(club) }} style={{ background: 'white', border: '0.5px solid #0F172A', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#0F172A', cursor: 'pointer' }}>Edit</button>
                {isLeagueAdmin() && (
                  <button onClick={() => handleDeleteClub(club.id)} style={{ background: 'white', border: '0.5px solid #DC2626', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#DC2626', cursor: 'pointer' }}>Delete</button>
                )}
              </div>
            )}
          </div>
          {session && player && !myMembership(club.id) && (
            <button onClick={() => handleRequestJoin(club.id)} style={{ background: '#0F172A', color: '#F8FAFC', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer' }}>Request to Join</button>
          )}
          {myMembership(club.id)?.status === 'pending' && (
            <div style={{ background: '#fef3c7', border: '0.5px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#92400e' }}>Your join request is pending approval.</div>
          )}
          {myMembership(club.id)?.status === 'approved' && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#065f46' }}>✓ You are a member of this club.</div>
          )}
        </div>

        {canManage && pending.length > 0 && (
          <div style={{ background: 'white', border: '0.5px solid #fcd34d', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>Pending requests ({pending.length})</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {pending.map(m => {
                const p = players.find(pl => pl.id === m.player_id)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '0.5px solid #fcd34d' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p?.name || 'Unknown'}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleApproveMember(m.id, m.player_id, club.name)} style={{ background: '#065F46', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => handleRejectMember(m.id)} style={{ background: 'white', color: '#DC2626', border: '0.5px solid #DC2626', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Decline</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>Members ({approved.length})</h3>
          {approved.length === 0 ? (
            <div style={{ fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>No approved members yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {approved.map(m => {
                const p = players.find(pl => pl.id === m.player_id)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>{m.role === 'organizer' ? '⭐ Club Organizer' : 'Member'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(p?.elo || 800)}</div>
                      {canManage && m.player_id !== player?.id && (
                        <>
                          {m.role !== 'organizer' && (
                            <button onClick={() => handleMakeOrganizer(m.id)} style={{ background: 'white', color: '#0F172A', border: '0.5px solid #0F172A', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Make Organizer</button>
                          )}
                          <button onClick={() => handleRemoveMember(m.id, m.player_id)} style={{ background: 'white', color: '#DC2626', border: '0.5px solid #DC2626', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Clubs</h2>
          <p style={{ fontSize: 12, color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Active Mahjong clubs on MahjRank</p>
        </div>
        {isLeagueAdmin() && (
          <button onClick={() => { setShowForm(!showForm); setEditingClub(null); setName(''); setLocation(''); setMeetDay('') }} style={{ background: '#0F172A', color: '#F8FAFC', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Add Club'}
          </button>
        )}
      </div>

      {message && (
        <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{message}</div>
      )}

      {showForm && (
        <form onSubmit={handleSaveClub} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>{editingClub ? 'Edit Club' : 'Add New Club'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Club name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shore Tiles" required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Red Bank Library" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Meeting day(s)</label>
              <input value={meetDay} onChange={e => setMeetDay(e.target.value)} placeholder="e.g. Tuesdays" />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ background: '#0F172A', color: '#F8FAFC', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving...' : editingClub ? 'Save Changes' : 'Add Club'}
          </button>
        </form>
      )}

      {clubs.length === 0 ? (
        <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>No clubs yet — add one to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {clubs.map(club => {
            const clubMemberships = memberships.filter(m => m.club_id === club.id && m.status === 'approved')
            const pendingCount = memberships.filter(m => m.club_id === club.id && m.status === 'pending').length
            const clubPlayers = players.filter(p => clubMemberships.some(m => m.player_id === p.id))
            const avgElo = clubPlayers.length > 0 ? Math.round(clubPlayers.reduce((s, p) => s + p.elo, 0) / clubPlayers.length) : 0
            const membership = myMembership(club.id)
            const canManage = isClubOrganizer(club)

            return (
              <div key={club.id} onClick={() => setSelectedClub(club.id)} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, cursor: 'pointer', position: 'relative' }}>
                {pendingCount > 0 && canManage && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#DC2626', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{pendingCount}</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>{club.name}</div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>{club.location || 'Location TBD'}</div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Meets: {club.meet_day || 'TBD'}</div>
                {membership && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: membership.status === 'approved' ? '#d1fae5' : '#fef3c7', color: membership.status === 'approved' ? '#065f46' : '#92400e' }}>
                      {membership.status === 'approved' ? '✓ Member' : '⏳ Pending'}
                    </span>
                  </div>
                )}
                <div style={{ borderTop: '0.5px solid #e8e8e4', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>Members</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{clubMemberships.length}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>Avg Elo</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace" }}>{avgElo || '—'}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}