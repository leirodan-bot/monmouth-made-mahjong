import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const C = {
  jade: '#065F46', jadeLt: '#059669', crimson: '#DC2626', gold: '#F59E0B', goldDk: '#D97706',
  midnight: '#0F172A', ink: '#1E293B', cloud: '#F8FAFC', slate: '#64748B', slateLt: '#94A3B8', border: '#E2E8F0',
}

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
    setClubs(clubData || []); setPlayers(playerData || []); setMemberships(memberData || []); setLoading(false)
  }

  function isLeagueAdmin() { return player?.role === 'admin' }
  function isClubOrganizer(club) { return isLeagueAdmin() || club.created_by === player?.id }
  function myMembership(clubId) { return memberships.find(m => m.club_id === clubId && m.player_id === player?.id) }

  async function handleSaveClub(e) {
    e.preventDefault(); setSaving(true)
    if (editingClub) { await supabase.from('organizations').update({ name: name.trim(), location: location.trim(), meet_day: meetDay.trim() }).eq('id', editingClub.id); setMessage('Club updated!') }
    else { await supabase.from('organizations').insert({ name: name.trim(), location: location.trim(), meet_day: meetDay.trim(), created_by: player?.id }); setMessage('Club added!') }
    setName(''); setLocation(''); setMeetDay(''); setShowForm(false); setEditingClub(null); fetchData(); setSaving(false); setTimeout(() => setMessage(''), 3000)
  }

  async function handleDeleteClub(clubId) { if (!window.confirm('Delete this club? This cannot be undone.')) return; await supabase.from('organizations').delete().eq('id', clubId); setSelectedClub(null); fetchData() }
  async function handleRequestJoin(clubId) { await supabase.from('club_members').insert({ club_id: clubId, player_id: player?.id, status: 'pending' }); setMessage('Join request sent!'); fetchData(); setTimeout(() => setMessage(''), 3000) }
  async function handleApproveMember(membershipId, playerId, clubName) { await supabase.from('club_members').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', membershipId); await supabase.from('players').update({ org: clubName }).eq('id', playerId); fetchData() }
  async function handleRejectMember(membershipId) { await supabase.from('club_members').delete().eq('id', membershipId); fetchData() }
  async function handleMakeOrganizer(membershipId) { await supabase.from('club_members').update({ role: 'organizer' }).eq('id', membershipId); fetchData() }
  async function handleRemoveMember(membershipId, playerId) { await supabase.from('club_members').delete().eq('id', membershipId); await supabase.from('players').update({ org: null }).eq('id', playerId); fetchData() }
  function startEdit(club) { setEditingClub(club); setName(club.name); setLocation(club.location || ''); setMeetDay(club.meet_day || ''); setShowForm(true) }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: C.slate }}>Loading clubs...</div>

  if (selectedClub) {
    const club = clubs.find(c => c.id === selectedClub)
    if (!club) { setSelectedClub(null); return null }
    const clubMemberships = memberships.filter(m => m.club_id === club.id)
    const approved = clubMemberships.filter(m => m.status === 'approved')
    const pending = clubMemberships.filter(m => m.status === 'pending')
    const canManage = isClubOrganizer(club)

    return (
      <div>
        <button onClick={() => setSelectedClub(null)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.midnight, marginBottom: 16, cursor: 'pointer' }}>← Back to clubs</button>
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.jade}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>{club.name}</h2>
              <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{club.location}</div>
              <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>Meets: {club.meet_day || 'TBD'}</div>
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setSelectedClub(null); startEdit(club) }} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.midnight, cursor: 'pointer' }}>Edit</button>
                {isLeagueAdmin() && <button onClick={() => handleDeleteClub(club.id)} style={{ background: 'white', border: `1px solid ${C.crimson}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.crimson, cursor: 'pointer' }}>Delete</button>}
              </div>
            )}
          </div>
          {/* Club Stats Header */}
          {(() => {
            const clubPlayers = players.filter(p => approved.some(m => m.player_id === p.id))
            const avgElo = clubPlayers.length > 0 ? Math.round(clubPlayers.reduce((s, p) => s + (p.elo || 800), 0) / clubPlayers.length) : 0
            const totalGames = clubPlayers.reduce((s, p) => s + (p.games_played || 0), 0)
            const highest = clubPlayers.length > 0 ? clubPlayers.reduce((best, p) => (p.elo || 0) > (best.elo || 0) ? p : best, clubPlayers[0]) : null
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
                {[
                  { label: 'Members', value: approved.length, color: C.jade },
                  { label: 'Avg Elo', value: avgElo || '—', color: C.crimson },
                  { label: 'Total Games', value: totalGames, color: C.midnight },
                  { label: 'Top Rated', value: highest ? highest.name.split(' ')[0] : '—', color: C.gold },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.cloud, border: `1px solid ${C.border}`, borderTop: `3px solid ${s.color}`, borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: C.slateLt, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )
          })()}
          {session && player && !myMembership(club.id) && <button onClick={() => handleRequestJoin(club.id)} style={{ background: C.crimson, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}>Request to Join</button>}
          {myMembership(club.id)?.status === 'pending' && <div style={{ background: 'rgba(245,158,11,0.05)', border: `1px solid rgba(245,158,11,0.15)`, borderLeft: `4px solid ${C.gold}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.goldDk }}>Your join request is pending approval.</div>}
          {myMembership(club.id)?.status === 'approved' && <div style={{ background: 'rgba(6,95,70,0.04)', border: `1px solid rgba(6,95,70,0.12)`, borderLeft: `4px solid ${C.jade}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.jade }}>✓ You are a member of this club.</div>}
        </div>

        {canManage && pending.length > 0 && (
          <div style={{ background: 'white', border: `1px solid rgba(245,158,11,0.2)`, borderLeft: `4px solid ${C.gold}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>Pending requests ({pending.length})</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {pending.map(m => {
                const p = players.find(pl => pl.id === m.player_id)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(245,158,11,0.04)', borderRadius: 8, border: `1px solid rgba(245,158,11,0.15)` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.midnight }}>{p?.name || 'Unknown'}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleApproveMember(m.id, m.player_id, club.name)} style={{ background: C.jade, color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                      <button onClick={() => handleRejectMember(m.id)} style={{ background: 'white', color: C.crimson, border: `1px solid ${C.crimson}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600 }}>Decline</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>Members ({approved.length})</h3>
          {approved.length === 0 ? <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>No approved members yet.</div> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {approved.map(m => {
                const p = players.find(pl => pl.id === m.player_id)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.cloud, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.midnight }}>{p?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{m.role === 'organizer' ? '⭐ Club Organizer' : 'Member'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(p?.elo || 800)}</div>
                      {canManage && m.player_id !== player?.id && (
                        <>
                          {m.role !== 'organizer' && <button onClick={() => handleMakeOrganizer(m.id)} style={{ background: 'white', color: C.midnight, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Make Organizer</button>}
                          <button onClick={() => handleRemoveMember(m.id, m.player_id)} style={{ background: 'white', color: C.crimson, border: `1px solid ${C.crimson}`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Remove</button>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Clubs</h2>
          <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Active Mahjong clubs on MahjRank</p>
        </div>
        {isLeagueAdmin() && <button onClick={() => { setShowForm(!showForm); setEditingClub(null); setName(''); setLocation(''); setMeetDay('') }} style={{ background: C.crimson, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>{showForm ? 'Cancel' : '+ Add Club'}</button>}
      </div>
      {message && <div style={{ background: 'rgba(6,95,70,0.04)', border: `1px solid rgba(6,95,70,0.12)`, borderLeft: `4px solid ${C.jade}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.jade, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{message}</div>}
      {showForm && (
        <form onSubmit={handleSaveClub} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>{editingClub ? 'Edit Club' : 'Add New Club'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Club name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shore Tiles" required /></div>
            <div><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Red Bank Library" /></div>
            <div><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Meeting day(s)</label><input value={meetDay} onChange={e => setMeetDay(e.target.value)} placeholder="e.g. Tuesdays" /></div>
          </div>
          <button type="submit" disabled={saving} style={{ background: C.crimson, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving...' : editingClub ? 'Save Changes' : 'Add Club'}</button>
        </form>
      )}
      {clubs.length === 0 ? (
        <div style={{ background: 'white', border: `1px dashed ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}><div style={{ fontSize: 14, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>No clubs yet — add one to get started.</div></div>
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
              <div key={club.id} onClick={() => setSelectedClub(club.id)} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', position: 'relative' }}>
                {pendingCount > 0 && canManage && <div style={{ position: 'absolute', top: 12, right: 12, background: C.crimson, color: 'white', borderRadius: 8, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{pendingCount}</div>}
                <div style={{ fontSize: 15, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>{club.name}</div>
                <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>{club.location || 'Location TBD'}</div>
                <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Meets: {club.meet_day || 'TBD'}</div>
                {membership && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: 0.3, background: membership.status === 'approved' ? 'rgba(6,95,70,0.06)' : 'rgba(245,158,11,0.06)', color: membership.status === 'approved' ? C.jade : C.goldDk }}>{membership.status === 'approved' ? '✓ MEMBER' : '⏳ PENDING'}</span>
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif" }}>Members</div><div style={{ fontSize: 16, fontWeight: 700, color: C.midnight }}>{clubMemberships.length}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: C.slateLt, fontFamily: "'DM Sans', sans-serif" }}>Avg Elo</div><div style={{ fontSize: 16, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>{avgElo || '—'}</div></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
