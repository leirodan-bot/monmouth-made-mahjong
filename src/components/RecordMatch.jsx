import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { calculateGameEloUpdates } from '../eloUtils'
import { C, fonts, shadows } from '../theme'
import useFriends from '../useFriends'
import { haptics } from '../native'
import WinAnimation from './WinAnimation'

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

export default function RecordMatch({ session, player, refreshPlayer, onDone }) {
  const [players, setPlayers] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [winner, setWinner] = useState('')
  const [isWallGame, setIsWallGame] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showWinAnimation, setShowWinAnimation] = useState(false)
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
  const [playerFilter, setPlayerFilter] = useState('friends') // 'friends' or 'all'
  const { friendIds } = useFriends(player?.id, player?.name)

  // Step 4 — all optional, badge-only fields
  const [winMethod, setWinMethod] = useState('')
  const [exposures, setExposures] = useState(null)
  const [jokerless, setJokerless] = useState(false)
  const [handSection, setHandSection] = useState('')

  useEffect(() => { fetchData() }, [])

  // Auto-add yourself to the table
  useEffect(() => {
    if (player?.id && !selectedPlayers.includes(player.id)) {
      setSelectedPlayers(prev => prev.includes(player.id) ? prev : [player.id, ...prev])
    }
  }, [player?.id])

  async function fetchData() {
    const { data: playerData } = await supabase.from('players').select('*').order('name')
    setPlayers(playerData || [])
    const { data: locData } = await supabase.from('locations').select('*').eq('created_by', player.id).order('created_at', { ascending: false })
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
    setStep(1); setSelectedPlayers(player?.id ? [player.id] : []); setSelectedLocation(null); setWinner(''); setIsWallGame(false)
    setWinMethod(''); setExposures(null); setJokerless(false); setHandSection(''); setPlayerFilter('friends'); setSearchQuery('')
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
    haptics.success() // Native haptic feedback on successful match recording
    if (refreshPlayer) refreshPlayer()
    // Show win animation if the current user won
    const playerWon = !isWallGame && winner === player?.id
    if (playerWon) {
      setShowWinAnimation(true)
    } else {
      setTimeout(() => { setSuccess(false); resetForm(); fetchData(); if (onDone) onDone() }, 2000)
    }
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

  const filteredPlayers = players.filter(p => {
    if (selectedPlayers.includes(p.id)) return false
    if (p.id === player?.id) return false // exclude self (auto-included)
    if (!p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (playerFilter === 'friends' && !searchQuery && !friendIds.has(p.id)) return false
    return true
  })
  const preview = getEloPreview()

  // Shared button styles
  const btnPrimary = { padding: 14, borderRadius: 12, border: 'none', fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', background: C.crimson, color: 'white', boxShadow: shadows.rose }
  const btnSecondary = { padding: 14, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', background: 'white', color: C.slate, fontWeight: 600 }
  const btnDisabled = { ...btnPrimary, background: '#E7E5E4', color: '#A8A29E', cursor: 'default', boxShadow: 'none' }

  return (
    <div>
      {/* Win celebration animation */}
      {showWinAnimation && (
        <WinAnimation
          winnerName={player?.name}
          onComplete={() => {
            setShowWinAnimation(false)
            setSuccess(false)
            resetForm()
            fetchData()
            if (onDone) onDone()
          }}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>Record a Game</h2>
        <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>1 player must confirm · Auto-verified after 48 hours</p>
      </div>

      {/* Submit / Confirm tabs */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${C.border}`, marginBottom: 20 }}>
        {['submit', 'confirm'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 18px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
            background: tab === t ? C.midnight : 'white', color: tab === t ? '#fff' : C.slate,
            border: 'none', transition: 'all 0.15s ease',
          }}>
            {t === 'submit' ? 'Submit Result' : `Confirm${pendingMatches.length > 0 ? ` (${pendingMatches.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ============================== SUBMIT TAB ============================== */}
      {tab === 'submit' && (
        <div>
          {success && (
            <div style={{ background: '#d1fae5', border: '1.5px solid #6ee7b7', borderRadius: 14, padding: '16px 18px', fontSize: 15, color: C.jade, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span> Game submitted! Taking you home...
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '16px 18px', fontSize: 14, color: '#991b1b', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 16 }}>
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
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: shadows.sm }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>Who's at the table?</div>
              <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Select 3–4 players · {selectedPlayers.length}/4 chosen</div>

              {/* Selected players as big chips */}
              {selectedPlayers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {selectedPlayers.map(id => {
                    const p = players.find(pl => pl.id === id)
                    const initials = p?.name ? p.name.split(' ').map(n => n[0]).join('') : '?'
                    const isSelf = id === player?.id
                    return (
                      <div key={id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12,
                        background: isSelf ? 'rgba(22,101,52,0.04)' : '#F0FDF4',
                        border: `1.5px solid ${C.jade}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: C.jade,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: C.jade, color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif", flexShrink: 0,
                        }}>{p?.avatar || initials}</div>
                        {isSelf ? 'You' : p?.name}
                        {!isSelf && <span onClick={() => togglePlayer(id)} style={{ cursor: 'pointer', color: C.crimson, fontWeight: 700, fontSize: 16, marginLeft: 4 }}>✕</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Player search & list */}
              {selectedPlayers.length < 4 && (
                <div>
                  {/* Friends / All Players toggle */}
                  <div style={{
                    display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden',
                    border: `1.5px solid ${C.border}`, marginBottom: 10,
                  }}>
                    {[
                      { key: 'friends', label: '👋 Friends', count: friendIds.size },
                      { key: 'all', label: '👥 All Players' },
                    ].map(t => (
                      <button key={t.key} onClick={() => setPlayerFilter(t.key)} style={{
                        flex: 1, padding: '10px 14px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                        cursor: 'pointer', border: 'none', transition: 'all 0.15s ease',
                        background: playerFilter === t.key ? C.midnight : 'white',
                        color: playerFilter === t.key ? '#fff' : C.slate,
                      }}>
                        {t.label}{t.count != null ? ` (${t.count})` : ''}
                      </button>
                    ))}
                  </div>

                  <input type="text" placeholder={playerFilter === 'friends' ? 'Search friends...' : 'Search all players...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif", marginBottom: 10, boxSizing: 'border-box', background: 'white',
                      outline: 'none', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = C.jade}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />

                  <div style={{ maxHeight: 280, overflowY: 'auto', display: 'grid', gap: 6 }}>
                    {filteredPlayers.length === 0 && playerFilter === 'friends' && !searchQuery && (
                      <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.midnight, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>No friends yet</div>
                        <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Add friends from the Community tab to see them here</div>
                        <button onClick={() => setPlayerFilter('all')} style={{
                          padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.jade}`, fontSize: 13,
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
                          background: 'white', color: C.jade,
                        }}>Browse All Players</button>
                      </div>
                    )}
                    {filteredPlayers.length === 0 && searchQuery && (
                      <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>
                        No {playerFilter === 'friends' ? 'friends' : 'players'} match "{searchQuery}"
                      </div>
                    )}
                    {filteredPlayers.slice(0, 20).map(p => {
                      const initials = p.name ? p.name.split(' ').map(n => n[0]).join('') : '?'
                      const isFriend = friendIds.has(p.id)
                      return (
                        <button key={p.id} type="button" onClick={() => { togglePlayer(p.id); setSearchQuery('') }}
                          style={{
                            padding: '12px 14px', borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
                            textAlign: 'left', cursor: 'pointer', background: 'white',
                            border: `1.5px solid ${C.border}`, color: C.midnight,
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: isFriend ? C.jade : C.cloud,
                            color: isFriend ? 'white' : C.slateLt,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: p.avatar ? 16 : 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif", flexShrink: 0,
                          }}>{p.avatar || initials}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {p.name}
                              {isFriend && <span style={{ fontSize: 10, marginLeft: 6, color: C.jade, fontWeight: 700 }}>👋</span>}
                            </div>
                            <div style={{ fontSize: 11, color: C.slate, marginTop: 1 }}>{p.town || 'No town'} · Elo {Math.round(p.elo || 800)}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <button disabled={selectedPlayers.length < 3} onClick={() => setStep(2)}
                style={{ marginTop: 16, width: '100%', padding: 14, borderRadius: 12, border: 'none', fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: selectedPlayers.length >= 3 ? 'pointer' : 'default', background: selectedPlayers.length >= 3 ? C.crimson : '#E7E5E4', color: selectedPlayers.length >= 3 ? 'white' : '#A8A29E', boxShadow: selectedPlayers.length >= 3 ? shadows.rose : 'none' }}>
                Next: Location →
              </button>
            </div>
          )}

          {/* ─── STEP 2: LOCATION ─── */}
          {step === 2 && (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: shadows.sm }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>Where did you play?</div>
              <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Optional — pick a location or skip ahead</div>

              {/* Location type tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[
                  { key: 'recent', label: '🕐 Recent' },
                  { key: 'clubs', label: '🏘️ Clubs' },
                  { key: 'home', label: '🏠 Home Games' },
                ].map(t => (
                  <button key={t.key} onClick={() => setLocTab(t.key)} style={{
                    padding: '8px 14px', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
                    background: locTab === t.key ? C.midnight : 'white', color: locTab === t.key ? C.cloud : C.slate,
                    border: locTab === t.key ? 'none' : `1.5px solid ${C.border}`,
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Location cards */}
              <div style={{ maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 8, marginBottom: 14 }}>
                {locations.filter(l => locTab === 'recent' ? true : locTab === 'clubs' ? l.type === 'club' : l.type === 'home')
                  .slice(0, locTab === 'recent' ? 5 : 20).map(l => {
                    const isSelected = selectedLocation?.id === l.id
                    const icon = l.type === 'club' ? '🏘️' : l.type === 'home' ? '🏠' : '📍'
                    return (
                      <button key={l.id} onClick={() => setSelectedLocation(isSelected ? null : l)} style={{
                        padding: '14px 16px', borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
                        textAlign: 'left', cursor: 'pointer',
                        background: isSelected ? '#F0FDF4' : 'white',
                        border: isSelected ? `2px solid ${C.jade}` : `1.5px solid ${C.border}`, color: C.midnight,
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: isSelected ? 'rgba(22,101,52,0.08)' : C.cloud,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                        }}>{icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{l.name}</div>
                          <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{l.type === 'club' ? 'Club' : l.type === 'home' ? 'Home Game' : 'Other'}</div>
                        </div>
                        {isSelected && <span style={{ fontSize: 13, fontWeight: 700, color: C.jade }}>✓</span>}
                      </button>
                    )
                  })}
                {locations.filter(l => locTab === 'recent' ? true : locTab === 'clubs' ? l.type === 'club' : l.type === 'home').length === 0 && (
                  <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", padding: 16, textAlign: 'center' }}>No locations yet. Create one below.</div>
                )}
              </div>

              {/* New location form */}
              {!showNewLoc ? (
                <button onClick={() => setShowNewLoc(true)} style={{ fontSize: 13, color: C.jade, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 14, padding: 0 }}>
                  + Add New Location
                </button>
              ) : (
                <div style={{ background: C.cloudLt, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
                  <input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Location name (e.g. Barbara's Tuesday Game)"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 10, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {['home', 'club', 'other'].map(t => (
                      <button key={t} onClick={() => setNewLocType(t)} style={{
                        padding: '8px 14px', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600,
                        background: newLocType === t ? C.midnight : 'white', color: newLocType === t ? C.cloud : C.slate,
                        border: newLocType === t ? 'none' : `1.5px solid ${C.border}`,
                      }}>
                        {t === 'home' ? '🏠 Home' : t === 'club' ? '🏘️ Club' : '📍 Other'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={createLocation} style={{ background: C.jade, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer' }}>Save Location</button>
                    <button onClick={() => setShowNewLoc(false)} style={{ background: 'white', color: C.slate, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ padding: 14, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', background: 'white', color: C.slate, fontWeight: 600 }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', background: C.crimson, color: 'white', boxShadow: shadows.rose }}>Next: Winner →</button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: WINNER ─── */}
          {step === 3 && (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: shadows.sm }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>Who won?</div>
              <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Select the winner or mark as a wall game</div>
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
              <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 0, boxShadow: shadows.sm }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight }}>Which hand won?</div>
                  <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Select the section from the NMJL card</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {NMJL_SECTIONS.map(sec => (
                    <button key={sec.key} onClick={() => setHandSection(handSection === sec.key ? '' : sec.key)} style={{
                      background: handSection === sec.key ? 'rgba(225,29,72,0.06)' : C.cloudLt,
                      border: `1.5px solid ${handSection === sec.key ? C.crimson : C.border}`,
                      borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: handSection === sec.key ? C.crimson : C.ink, letterSpacing: -0.3 }}>{sec.key}</div>
                      <div style={{ fontSize: 11, color: C.slate, marginTop: 3 }}>{sec.name}</div>
                    </button>
                  ))}
                </div>

                {/* Next button — right after NMJL */}
                <button onClick={() => setStep(5)} style={{ marginTop: 18, width: '100%', padding: 14, borderRadius: 12, border: 'none', fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', background: C.crimson, color: 'white', boxShadow: shadows.rose }}>
                  Review & Submit →
                </button>
              </div>

              {/* Self-logged winner warning */}
              {winner === player?.id && (
                <div style={{ margin: '12px 0', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                    If you won this game, it'll stay <span style={{ color: C.goldDk, fontWeight: 600 }}>unverified</span> until another player confirms.
                  </span>
                </div>
              )}

              {/* ══ Optional badge section — below submit ══ */}
              <div style={{ marginTop: 12, background: 'white', borderRadius: 14, border: `1.5px dashed ${C.gold}`, padding: 20, boxShadow: shadows.sm }}>
                {/* Badge header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🏅</div>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.goldDk }}>Want to earn badges?</div>
                    <div style={{ fontSize: 12, color: C.slate, marginTop: 1 }}>Add a few more details about this win</div>
                  </div>
                </div>

                {/* How did they win? */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>How did they win?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { k: 'self_pick', label: '🧱 From the wall', sub: 'Drew it themselves' },
                      { k: 'discard', label: '🤚 Called a discard', sub: 'Picked up a thrown tile' },
                    ].map(m => (
                      <button key={m.k} onClick={() => setWinMethod(winMethod === m.k ? '' : m.k)} style={{
                        flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                        background: winMethod === m.k ? (m.k === 'self_pick' ? 'rgba(22,101,52,0.06)' : 'rgba(225,29,72,0.05)') : C.cloudLt,
                        border: `1.5px solid ${winMethod === m.k ? (m.k === 'self_pick' ? C.jadeLt : C.crimson) : C.border}`,
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: winMethod === m.k ? C.ink : C.midnight, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: C.slate, marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{m.sub}</div>
                      </button>
                    ))}
                  </div>
                  <BadgeHint text="Wall Walker & Lucky Pick" />
                </div>

                <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

                {/* Exposures */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Exposures</div>
                  <div style={{ fontSize: 12, color: C.slate, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Groups shown on the table (not counting the winning tile)</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1, 2, 3, '4+'].map(n => (
                      <button key={n} onClick={() => setExposures(exposures === n ? null : n)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        fontSize: 16, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                        background: exposures === n ? 'rgba(22,101,52,0.06)' : C.cloudLt,
                        border: `1.5px solid ${exposures === n ? C.jadeLt : C.border}`,
                        color: exposures === n ? C.jade : C.midnight,
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
                    background: jokerless ? 'rgba(245,158,11,0.06)' : C.cloudLt,
                    border: `1.5px solid ${jokerless ? C.gold : C.border}`,
                    borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                      background: jokerless ? C.gold : 'white',
                      border: jokerless ? 'none' : `1.5px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: jokerless ? 'white' : 'transparent', fontWeight: 700,
                    }}>✓</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: jokerless ? C.goldDk : C.ink, fontFamily: "'DM Sans', sans-serif" }}>Jokerless hand</div>
                      <div style={{ fontSize: 12, color: C.slate, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>No jokers used in the winning hand</div>
                    </div>
                  </button>
                  <BadgeHint text="Unlocks the Purist badge" />
                </div>
              </div>

              {/* Back button below everything */}
              <div style={{ marginTop: 14 }}>
                <button onClick={() => setStep(3)} style={{ width: '100%', padding: 14, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', background: 'white', color: C.slate, fontWeight: 600 }}>← Back to Winner</button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: CONFIRM & SUBMIT ─── */}
          {step === 5 && (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: shadows.sm }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>Review & Submit</div>
              <div style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Make sure everything looks right</div>

              {/* Summary card */}
              <div style={{ background: C.cloudLt, borderRadius: 12, padding: 18, marginBottom: 16, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'grid', gap: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Players</div>
                    <div style={{ color: C.midnight, fontWeight: 600 }}>{selectedPlayers.map(id => players.find(p => p.id === id)?.name).join(', ')}</div>
                  </div>
                  {selectedLocation && (
                    <div>
                      <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Location</div>
                      <div style={{ color: C.midnight, fontWeight: 600 }}>{selectedLocation.name}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Result</div>
                    <div style={{ color: C.midnight, fontWeight: 700, fontSize: 16 }}>{isWallGame ? '🧱 Wall Game' : `🏆 ${players.find(p => p.id === winner)?.name} won`}</div>
                  </div>
                  {!isWallGame && handSection && (
                    <div>
                      <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Hand</div>
                      <div style={{ color: C.midnight, fontWeight: 600 }}>{NMJL_SECTIONS.find(s => s.key === handSection)?.name}</div>
                    </div>
                  )}
                  {!isWallGame && winMethod && (
                    <div>
                      <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Method</div>
                      <div style={{ color: C.midnight, fontWeight: 600 }}>{winMethod === 'self_pick' ? 'From the wall' : 'Called a discard'}</div>
                    </div>
                  )}
                  {!isWallGame && exposures !== null && (
                    <div>
                      <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Exposures</div>
                      <div style={{ color: C.midnight, fontWeight: 600 }}>{exposures}</div>
                    </div>
                  )}
                  {!isWallGame && jokerless && (
                    <div>
                      <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Jokerless</div>
                      <div style={{ color: C.goldDk, fontWeight: 700 }}>Yes 🏅</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Elo preview */}
              {preview && (
                <div style={{ background: C.cloudLt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                    {isWallGame ? 'Wall Game — No Rating Changes' : 'Elo Changes'}
                  </div>
                  {preview.map(u => {
                    const p = players.find(pl => pl.id === u.id)
                    const isW = u.id === winner
                    return (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                        <span style={{ color: C.midnight, fontWeight: isW ? 700 : 500 }}>{isW && '🏆 '}{p?.name}</span>
                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: u.delta > 0 ? C.jade : u.delta < 0 ? C.crimson : C.slate }}>
                          {u.delta > 0 ? '+' : ''}{u.delta.toFixed(1)} → {Math.round(u.newRating)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {winner === player?.id && (
                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#92400e', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>⚠️</span> You are submitting yourself as the winner. This game will show as "unverified" until another player confirms.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(isWallGame ? 3 : 4)} style={{ padding: 14, borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', background: 'white', color: C.slate, fontWeight: 600 }}>← Back</button>
                <button disabled={saving} onClick={handleSubmit} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: saving ? 'default' : 'pointer', background: saving ? '#E7E5E4' : C.jade, color: 'white', boxShadow: saving ? 'none' : shadows.jade }}>
                  {saving ? 'Submitting...' : '✓ Submit Game Result'}
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