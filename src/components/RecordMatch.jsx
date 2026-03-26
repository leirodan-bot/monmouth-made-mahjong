import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { calculateGameEloUpdates } from '../eloUtils'
import { C, fonts, shadows } from '../theme'

// NMJL sections in card order (top to bottom) — simplified for badge tracking
const NMJL_SECTIONS = [
  { key: '2026', name: 'Year' },
  { key: '2468', name: 'Evens' },
  { key: 'LIKE', name: 'Any Like Numbers' },
  { key: 'QU', name: 'Quints' },
  { key: 'CR', name: 'Consecutive Run' },
  { key: '13579', name: 'Odds' },
  { key: 'WD', name: 'Winds & Dragons' },
  { key: '369', name: '3-6-9' },
  { key: 'SP', name: 'Singles & Pairs' },
]
function BadgeHint({ text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
      background: C.goldPale, border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600,
      color: C.goldDk, letterSpacing: 0.2,
    }}>
      <span style={{ fontSize: 14 }}>🏅</span>{text}
    </div>
  )
}

export default function RecordMatch({ session, player }) {
  const [players, setPlayers] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [winner, setWinner] = useState('')
  const [isWallGame, setIsWallGame] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pendingMatches, setPendingMatches] = useState([])
  const [tab, setTab] = useState('submit')
  const [searchQuery, setSearchQuery] = useState('')
  const [step, setStep] = useState(1)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locTab, setLocTab] = useState('recent')
  const [newLocName, setNewLocName] = useState('')
  const [newLocType, setNewLocType] = useState('home')
  const [showNewLoc, setShowNewLoc] = useState(false)
  // Step 4 — all optional, badge-only fields
  const [winMethod, setWinMethod] = useState('')
  const [exposures, setExposures] = useState(null)
  const [jokerless, setJokerless] = useState(false)
  const [handSection, setHandSection] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: playerData } = await supabase.from('players').select('*').order('name')
    setPlayers(playerData || [])
    const { data: locData } = await supabase.from('locations').select('*').order('created_at', { ascending: false })
    setLocations(locData || [])
    if (player?.id) {
      const { data: matchData } = await supabase
        .from('matches').select('*').eq('status', 'pending')
        .contains('player_ids', [player.id]).neq('submitted_by', player.id)
      setPendingMatches(matchData || [])
    }
    setLoading(false)
  }

  function togglePlayer(id) {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== id))
      if (winner === id) setWinner('')
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, id])
    }
  }

  function resetForm() {
    setStep(1); setSelectedPlayers([]); setSelectedLocation(null); setWinner(''); setIsWallGame(false)
    setWinMethod(''); setExposures(null); setJokerless(false); setHandSection('')
  }

  async function createLocation() {
    if (!newLocName.trim()) return
    const { data } = await supabase.from('locations').insert({ name: newLocName.trim(), type: newLocType, created_by: player.id }).select().single()
    if (data) { setLocations([data, ...locations]); setSelectedLocation(data); setShowNewLoc(false); setNewLocName('') }
  }

  function getEloPreview() {
    if (selectedPlayers.length < 3 || (!winner && !isWallGame)) return null
    const tablePlayers = players.filter(p => selectedPlayers.includes(p.id))
      .map(p => ({ id: p.id, elo: p.elo, games_played: p.games_played, elo_rated_games: p.elo_rated_games || 0, elo_seasonal_games: p.elo_seasonal_games || 0 }))
    return calculateGameEloUpdates(tablePlayers, isWallGame ? null : winner)
  }

  async function handleSubmit() {
    if (selectedPlayers.length < 3 || selectedPlayers.length > 4) return
    if (!isWallGame && !winner) return
    setSaving(true); setError('')
    const tablePlayers = players.filter(p => selectedPlayers.includes(p.id))
      .map(p => ({ id: p.id, elo: p.elo, games_played: p.games_played, elo_rated_games: p.elo_rated_games || 0, elo_seasonal_games: p.elo_seasonal_games || 0 }))
    const eloUpdates = calculateGameEloUpdates(tablePlayers, isWallGame ? null : winner)
    const matchRecord = {
      winner_id: isWallGame ? null : winner,
      loser_ids: isWallGame ? [] : selectedPlayers.filter(id => id !== winner),
      player_ids: selectedPlayers,
      is_wall_game: isWallGame,
      elo_updates: eloUpdates,
      status: 'pending',
      submitted_by: player.id,
      confirmations: [],
      played_at: new Date().toISOString(),
      winner_is_logger: winner === player.id,
      location_id: selectedLocation?.id || null,
      win_method: isWallGame ? null : winMethod || null,
      thrower_id: null,
      exposures: isWallGame ? null : exposures,
      jokerless: isWallGame ? false : jokerless,
      hand_section: isWallGame ? null : handSection || null,
      hand_line: null,
      hand_points: null,
    }
    const { data: matchData, error: matchError } = await supabase.from('matches').insert(matchRecord).select().single()
    if (matchError) { setError('Something went wrong. Please try again.'); setSaving(false); return }
    const otherPlayers = selectedPlayers.filter(id => id !== player.id)
    const submitterName = player?.name || 'Someone'
    const winnerName = players.find(p => p.id === winner)?.name
    for (const pid of otherPlayers) {
      await supabase.from('notifications').insert({
        player_id: pid, match_id: matchData.id, type: 'confirm_match', read: false,
        message: isWallGame ? `${submitterName} recorded a wall game. Please confirm.`
          : `${submitterName} recorded a game where ${winnerName} won. Please confirm or dispute.`
      })
    }
    setSuccess(true); setSaving(false)
    setTimeout(() => { setSuccess(false); resetForm(); fetchData() }, 3000)
  }

  async function confirmMatch(matchId) {
    try { await supabase.rpc('confirm_game', { p_match_id: matchId, p_player_id: player.id }) } catch (err) { console.error('Confirm failed:', err) }
    fetchData()
  }

  async function disputeMatch(matchId) {
    try { await supabase.rpc('dispute_game', { p_match_id: matchId, p_player_id: player.id }) } catch (err) { console.error('Dispute failed:', err) }
    fetchData()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: C.slate }}>Loading...</div>

  const filteredPlayers = players.filter(p => !selectedPlayers.includes(p.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const preview = getEloPreview()

  // Shared button styles
  const btnPrimary = { padding: 11, borderRadius: 8, border: 'none', fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', background: C.crimson, color: 'white' }
  const btnSecondary = { padding: 11, borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', background: 'white', color: C.slate }
  const btnDisabled = { ...btnPrimary, background: '#e5e7eb', color: '#aaa', cursor: 'default' }
  const stepLabel = { fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6, letterSpacing: '1px' }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>Record a Game</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>1 player must confirm · Auto-verified after 48 hours</p>
      </div>

      {/* Submit / Confirm tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['submit', 'confirm'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer',
            background: tab === t ? C.midnight : 'white', color: tab === t ? C.cloud : C.midnight,
            border: tab === t ? 'none' : `0.5px solid ${C.border}`
          }}>
            {t === 'submit' ? 'Submit Result' : `Confirm Results${pendingMatches.length > 0 ? ` (${pendingMatches.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ============================== SUBMIT TAB ============================== */}
      {tab === 'submit' && (
        <div>
          {success && (
            <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: C.jade, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
              Game submitted! Waiting for confirmation.
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#991b1b', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Step progress bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s < step ? C.jadeLt : s === step ? C.crimson : '#e8e8e4' }} />
            ))}
          </div>

          {/* ─── STEP 1: PLAYERS ─── */}
          {step === 1 && (
            <div style={{ background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <label style={stepLabel}>STEP 1 — PLAYERS AT THE TABLE ({selectedPlayers.length}/4)</label>
              {selectedPlayers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {selectedPlayers.map(id => {
                    const p = players.find(pl => pl.id === id)
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, background: '#F0FDF4', border: `1px solid ${C.jade}`, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: C.jade }}>
                        {p?.name}
                        <span onClick={() => togglePlayer(id)} style={{ cursor: 'pointer', color: C.crimson, fontWeight: 700 }}>✕</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {selectedPlayers.length < 4 && (
                <div>
                  <input type="text" placeholder="Search players..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 6, boxSizing: 'border-box' }} />
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {filteredPlayers.slice(0, 20).map(p => (
                      <button key={p.id} type="button" onClick={() => { togglePlayer(p.id); setSearchQuery('') }}
                        style={{ padding: '6px 8px', borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif", textAlign: 'left', cursor: 'pointer', background: 'white', border: `0.5px solid ${C.border}`, color: C.midnight }}>
                        {p.name} <span style={{ fontSize: 10, color: C.slate }}>{Math.round(p.elo || 800)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button disabled={selectedPlayers.length < 3} onClick={() => setStep(2)}
                style={{ marginTop: 16, width: '100%', ...(selectedPlayers.length >= 3 ? btnPrimary : btnDisabled) }}>
                Next: Location →
              </button>
            </div>
          )}

          {/* ─── STEP 2: LOCATION ─── */}
          {step === 2 && (
            <div style={{ background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <label style={stepLabel}>STEP 2 — WHERE DID YOU PLAY?</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['recent', 'clubs', 'home'].map(t => (
                  <button key={t} onClick={() => setLocTab(t)} style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
                    background: locTab === t ? C.midnight : 'white', color: locTab === t ? C.cloud : C.slate,
                    border: locTab === t ? 'none' : `0.5px solid ${C.border}`
                  }}>
                    {t === 'recent' ? 'Recent' : t === 'clubs' ? 'Clubs' : 'Home Games'}
                  </button>
                ))}
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 6, marginBottom: 12 }}>
                {locations.filter(l => locTab === 'recent' ? true : locTab === 'clubs' ? l.type === 'club' : l.type === 'home')
                  .slice(0, locTab === 'recent' ? 5 : 20).map(l => (
                    <button key={l.id} onClick={() => setSelectedLocation(l)} style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif", textAlign: 'left', cursor: 'pointer',
                      background: selectedLocation?.id === l.id ? '#F0FDF4' : 'white',
                      border: selectedLocation?.id === l.id ? `1.5px solid ${C.jade}` : `0.5px solid ${C.border}`, color: C.midnight
                    }}>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{l.type === 'club' ? 'Club' : l.type === 'home' ? 'Home Game' : 'Other'}</div>
                    </button>
                  ))}
                {locations.filter(l => locTab === 'recent' ? true : locTab === 'clubs' ? l.type === 'club' : l.type === 'home').length === 0 && (
                  <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", padding: 12 }}>No locations yet. Create one below.</div>
                )}
              </div>
              {!showNewLoc ? (
                <button onClick={() => setShowNewLoc(true)} style={{ fontSize: 12, color: C.jade, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 12 }}>
                  + New Location
                </button>
              ) : (
                <div style={{ background: C.cloud, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location name (e.g. Barbara's Tuesday Game)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `0.5px solid ${C.border}`, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {['home', 'club', 'other'].map(t => (
                      <button key={t} onClick={() => setNewLocType(t)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                        background: newLocType === t ? C.midnight : 'white', color: newLocType === t ? C.cloud : C.slate,
                        border: newLocType === t ? 'none' : `0.5px solid ${C.border}`
                      }}>
                        {t === 'home' ? 'Home Game' : t === 'club' ? 'Club' : 'Other'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={createLocation} style={{ background: C.midnight, color: C.cloud, border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setShowNewLoc(false)} style={{ background: 'white', color: C.slate, border: `0.5px solid ${C.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={btnSecondary}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, ...btnPrimary }}>Next: Winner →</button>
              </div>
              {!selectedLocation && <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>Location is optional — you can skip it.</div>}
            </div>
          )}

          {/* ─── STEP 3: WINNER ─── */}
          {step === 3 && (
            <div style={{ background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <label style={stepLabel}>STEP 3 — WHO WON?</label>
              <div style={{ marginBottom: 12 }}>
                <button type="button" onClick={() => { setIsWallGame(!isWallGame); if (!isWallGame) setWinner('') }} style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                  background: isWallGame ? C.goldPale : 'white', color: isWallGame ? C.goldDk : C.midnight,
                  border: isWallGame ? `1.5px solid ${C.gold}` : `1.5px solid ${C.border}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>🧱 {isWallGame ? 'Wall Game (No Winner)' : 'Wall Game?'}</span>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: isWallGame ? `2px solid ${C.gold}` : `2px solid ${C.border}`,
                    background: isWallGame ? C.gold : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white',
                  }}>{isWallGame ? '✓' : ''}</div>
                </button>
              </div>
              {!isWallGame && (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {selectedPlayers.map(id => {
                    const p = players.find(pl => pl.id === id)
                    const isSelected = winner === id
                    const initials = p?.name ? p.name.split(' ').map(n => n[0]).join('') : '?'
                    return (
                      <button key={id} type="button" onClick={() => setWinner(id)} style={{
                        padding: '12px 14px', borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
                        textAlign: 'left', cursor: 'pointer',
                        background: isSelected ? C.jadePale : 'white',
                        border: isSelected ? `2px solid ${C.jade}` : `1.5px solid ${C.border}`, color: C.midnight,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isSelected ? C.jade : C.cloud,
                          color: isSelected ? 'white' : C.slateLt,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: p?.avatar ? 16 : 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif", flexShrink: 0,
                        }}>{p?.avatar || initials}</div>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: isSelected ? 700 : 500 }}>{p?.name}</span>
                        {isSelected && <span style={{ fontSize: 12, fontWeight: 700, color: C.jade }}>Winner ✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={btnSecondary}>← Back</button>
                <button disabled={!isWallGame && !winner} onClick={() => setStep(isWallGame ? 5 : 4)}
                  style={{ flex: 1, ...((isWallGame || winner) ? btnPrimary : btnDisabled) }}>
                  {isWallGame ? 'Next: Confirm →' : 'Next: Win Details →'}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: WIN DETAILS (all optional — badge data) ─── */}
          {step === 4 && !isWallGame && (
            <div>
              {/* ══ NMJL Section — top card ══ */}
              <div style={{ background: C.cloud, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight }}>Which hand won?</div>
                  <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>Select the section from the NMJL card</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {NMJL_SECTIONS.map(sec => (
                    <button key={sec.key} onClick={() => setHandSection(handSection === sec.key ? '' : sec.key)} style={{
                      background: handSection === sec.key ? 'rgba(225,29,72,0.06)' : 'white',
                      border: `1.5px solid ${handSection === sec.key ? C.crimson : C.border}`,
                      borderRadius: 10, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: handSection === sec.key ? C.crimson : C.ink, letterSpacing: -0.3 }}>{sec.key}</div>
                      <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{sec.name}</div>
                    </button>
                  ))}
                </div>

                {/* Submit button — right after NMJL */}
                <button onClick={() => setStep(5)} style={{ marginTop: 18, width: '100%', ...btnPrimary, boxShadow: '0 4px 16px rgba(220,38,38,0.2)' }}>
                  Confirm & Submit →
                </button>
              </div>

              {/* Self-logged winner warning */}
              {winner === player?.id && (
                <div style={{ margin: '10px 0', padding: '10px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: C.slate, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                    If you won this game, it'll stay <span style={{ color: C.goldDk, fontWeight: 600 }}>unverified</span> until another player confirms.
                  </span>
                </div>
              )}

              {/* ══ Optional badge section — below submit ══ */}
              <div style={{ marginTop: 10, background: 'rgba(245,158,11,0.02)', borderRadius: 12, border: '1.5px dashed rgba(245,158,11,0.2)', padding: 20 }}>
                {/* Badge header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🏅</div>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: C.goldDk }}>Want to earn badges?</div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 1 }}>Add a few more details about this win</div>
                  </div>
                </div>

                {/* How did they win? */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 8 }}>How did they win?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { k: 'self_pick', label: '🧱 From the wall', sub: 'Drew it themselves' },
                      { k: 'discard', label: '🤚 Called a discard', sub: 'Picked up a thrown tile' },
                    ].map(m => (
                      <button key={m.k} onClick={() => setWinMethod(winMethod === m.k ? '' : m.k)} style={{
                        flex: 1, padding: '12px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        background: winMethod === m.k ? (m.k === 'self_pick' ? 'rgba(22,101,52,0.06)' : 'rgba(225,29,72,0.05)') : 'white',
                        border: `1.5px solid ${winMethod === m.k ? (m.k === 'self_pick' ? C.jadeLt : C.crimson) : C.border}`,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: winMethod === m.k ? C.ink : C.slate, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: C.slateMd, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{m.sub}</div>
                      </button>
                    ))}
                  </div>
                  <BadgeHint text="Wall Walker & Lucky Pick" />
                </div>

                <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

                {/* Exposures */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 3 }}>Exposures</div>
                  <div style={{ fontSize: 10, color: C.slate, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Groups shown on the table (not counting the winning tile)</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1, 2, 3, '4+'].map(n => (
                      <button key={n} onClick={() => setExposures(exposures === n ? null : n)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                        background: exposures === n ? 'rgba(22,101,52,0.06)' : 'white',
                        border: `1.5px solid ${exposures === n ? C.jadeLt : C.border}`,
                        color: exposures === n ? C.jade : C.slate,
                      }}>{n}</button>
                    ))}
                  </div>
                  <BadgeHint text="0 exposures = Concealed Hand" />
                </div>

                <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

                {/* Jokerless */}
                <div>
                  <button onClick={() => setJokerless(!jokerless)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    background: jokerless ? 'rgba(245,158,11,0.06)' : 'white',
                    border: `1.5px solid ${jokerless ? C.gold : C.border}`,
                    borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: jokerless ? C.gold : 'white',
                      border: jokerless ? 'none' : `1.5px solid #CBD5E1`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: jokerless ? 'white' : 'transparent', fontWeight: 700,
                    }}>✓</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: jokerless ? C.goldDk : C.ink, fontFamily: "'DM Sans', sans-serif" }}>Jokerless hand</div>
                      <div style={{ fontSize: 10, color: C.slate, marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>No jokers used in the winning hand</div>
                    </div>
                  </button>
                  <BadgeHint text="Unlocks the Purist badge" />
                </div>
              </div>

              {/* Back button below everything */}
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setStep(3)} style={{ ...btnSecondary, width: '100%' }}>← Back to Winner</button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: CONFIRM & SUBMIT ─── */}
          {step === 5 && (
            <div style={{ background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <label style={stepLabel}>STEP 5 — REVIEW & SUBMIT</label>
              <div style={{ background: C.cloud, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'grid', gap: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                  <div><span style={{ color: C.slate }}>Players:</span> <span style={{ color: C.midnight, fontWeight: 600 }}>{selectedPlayers.map(id => players.find(p => p.id === id)?.name).join(', ')}</span></div>
                  {selectedLocation && <div><span style={{ color: C.slate }}>Location:</span> <span style={{ color: C.midnight, fontWeight: 600 }}>{selectedLocation.name}</span></div>}
                  <div><span style={{ color: C.slate }}>Result:</span> <span style={{ color: C.midnight, fontWeight: 600 }}>{isWallGame ? '🧱 Wall Game' : `🏆 ${players.find(p => p.id === winner)?.name} won`}</span></div>
                  {!isWallGame && handSection && <div><span style={{ color: C.slate }}>Hand:</span> <span style={{ color: C.midnight, fontWeight: 600 }}>{NMJL_SECTIONS.find(s => s.key === handSection)?.name}</span></div>}
                  {!isWallGame && winMethod && <div><span style={{ color: C.slate }}>Method:</span> <span style={{ color: C.midnight, fontWeight: 600 }}>{winMethod === 'self_pick' ? 'From the wall' : 'Called a discard'}</span></div>}
                  {!isWallGame && exposures !== null && <div><span style={{ color: C.slate }}>Exposures:</span> <span style={{ color: C.midnight, fontWeight: 600 }}>{exposures}</span></div>}
                  {!isWallGame && jokerless && <div><span style={{ color: C.slate }}>Jokerless:</span> <span style={{ color: C.goldDk, fontWeight: 600 }}>Yes</span></div>}
                </div>
              </div>
              {preview && (
                <div style={{ background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: C.slate, fontFamily: "'DM Sans', sans-serif", letterSpacing: '1px', marginBottom: 8 }}>
                    {isWallGame ? 'WALL GAME — NO RATING CHANGES' : 'ELO CHANGES'}
                  </div>
                  {preview.map(u => {
                    const p = players.find(pl => pl.id === u.id)
                    const isW = u.id === winner
                    return (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                        <span style={{ color: C.midnight, fontWeight: isW ? 700 : 400 }}>{isW && '🏆 '}{p?.name}</span>
                        <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: u.delta > 0 ? C.jade : u.delta < 0 ? C.crimson : C.slate }}>
                          {u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)} → {Math.round(u.newRating)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              {winner === player?.id && (
                <div style={{ background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#92400e', marginBottom: 16 }}>
                  ⚠ You are submitting yourself as the winner. This game will show as "unverified" until another player confirms it.
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(isWallGame ? 3 : 4)} style={btnSecondary}>← Back</button>
                <button disabled={saving} onClick={handleSubmit} style={{ flex: 1, ...btnPrimary }}>
                  {saving ? 'Submitting...' : 'Submit Game Result'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================== CONFIRM TAB ============================== */}
      {tab === 'confirm' && (
        <div>
          {pendingMatches.length === 0 ? (
            <div style={{ background: 'white', border: `0.5px dashed ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>No pending confirmations — you're all caught up!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {pendingMatches.map(match => {
                const winnerPlayer = players.find(p => p.id === match.winner_id)
                const confirmations = match.confirmations || []
                const alreadyConfirmed = confirmations.includes(player?.id)
                return (
                  <div key={match.id} style={{ background: 'white', border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
                      {match.is_wall_game ? '🧱 Wall Game' : `🏆 ${winnerPlayer?.name || 'Unknown'} won`}
                    </div>
                    <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                      {new Date(match.played_at).toLocaleDateString()} · {confirmations.length}/1 confirmations
                    </div>
                    {match.hand_section && (
                      <div style={{ fontSize: 11, color: C.ink, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                        {NMJL_SECTIONS.find(s => s.key === match.hand_section)?.name || match.hand_section}
                        {match.jokerless ? ' · Jokerless' : ''}
                        {match.win_method === 'self_pick' ? ' · From the wall' : match.win_method === 'discard' ? ' · Called a discard' : ''}
                      </div>
                    )}
                    {match.elo_updates && (
                      <div style={{ background: C.cloud, borderRadius: 6, padding: '8px 10px', marginBottom: 10, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                        {match.elo_updates.map(u => {
                          const p = players.find(pl => pl.id === u.id)
                          return (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{p?.name}</span>
                              <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: u.delta > 0 ? C.jade : u.delta < 0 ? C.crimson : C.slate }}>{u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {alreadyConfirmed ? (
                      <div style={{ fontSize: 12, color: C.jade, fontFamily: "'DM Sans', sans-serif", background: '#d1fae5', padding: '6px 12px', borderRadius: 6 }}>✓ You confirmed this game</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => confirmMatch(match.id)} style={{ background: C.jade, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>✓ Confirm</button>
                        <button onClick={() => disputeMatch(match.id)} style={{ background: 'white', color: C.crimson, border: `0.5px solid ${C.crimson}`, borderRadius: 6, padding: '7px 16px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>Dispute</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}