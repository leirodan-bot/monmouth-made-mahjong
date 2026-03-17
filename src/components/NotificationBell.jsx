import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { getTier } from '../eloUtils'

export default function NotificationBell({ player, onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const dropdownRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const pendingConfirms = notifications.filter(n => n.type === 'confirm_match' && !n.read)

  useEffect(() => {
    if (player?.id) {
      fetchNotifications()
      fetchPlayers()
    }
    // Poll every 30 seconds
    const interval = setInterval(() => { if (player?.id) fetchNotifications() }, 30000)
    return () => clearInterval(interval)
  }, [player?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
  }

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*')
    setAllPlayers(data || [])
  }

  async function handleConfirm(notif) {
    if (!notif.match_id) return
    setConfirming(notif.id)

    // Fetch the match
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', notif.match_id)
      .single()

    if (!match || match.status !== 'pending') {
      // Already confirmed or disputed
      await markRead(notif.id)
      setConfirming(null)
      fetchNotifications()
      return
    }

    const currentConfirmations = match.confirmations || []
    if (currentConfirmations.includes(player.id)) {
      await markRead(notif.id)
      setConfirming(null)
      return
    }

    const newConfirmations = [...currentConfirmations, player.id]

    // 1 confirmation needed per spec
    if (newConfirmations.length >= 1) {
      const eloUpdates = match.elo_updates || []
      const allPlayersList = allPlayers.length > 0 ? allPlayers : []

      for (const update of eloUpdates) {
        const p = allPlayersList.find(pl => pl.id === update.id)
        if (!p) continue

        const isWinner = update.id === match.winner_id
        const isWall = match.is_wall_game
        const newTier = getTier(update.newRating).name
        const newPeak = Math.max(p.elo_peak || p.elo, update.newRating)
        const newGamesPlayed = (p.games_played || 0) + 1

        const playerUpdate = {
          elo: update.newRating,
          elo_all_time: Math.max(p.elo_all_time || update.newRating, update.newRating),
          elo_peak: newPeak,
          elo_rank_tier: newTier,
          elo_provisional: newGamesPlayed < 5,
          games_played: newGamesPlayed,
          last_game_date: new Date().toISOString().split('T')[0],
        }

        if (isWall) {
          playerUpdate.wall_games = (p.wall_games || 0) + 1
        } else if (isWinner) {
          playerUpdate.wins = (p.wins || 0) + 1
          playerUpdate.current_streak = (p.current_streak || 0) + 1
        } else {
          playerUpdate.losses = (p.losses || 0) + 1
          playerUpdate.current_streak = 0
        }

        await supabase.from('players').update(playerUpdate).eq('id', update.id)

        await supabase.from('elo_history').insert({
          player_id: update.id,
          game_id: match.id,
          rating_before: update.ratingBefore,
          rating_after: update.newRating,
          rating_change: update.delta,
          k_factor: update.kFactor,
        })
      }

      await supabase.from('matches').update({
        status: 'confirmed',
        confirmations: newConfirmations,
        confirmed_at: new Date().toISOString()
      }).eq('id', match.id)

      // Notify all players that game was verified
      const matchPlayers = match.player_ids || []
      for (const pid of matchPlayers) {
        if (pid === player.id) continue
        await supabase.from('notifications').insert({
          player_id: pid,
          match_id: match.id,
          type: 'verified',
          read: false,
          message: `${player.name} confirmed the game. Elo ratings have been updated.`
        })
      }
    } else {
      await supabase.from('matches').update({ confirmations: newConfirmations }).eq('id', match.id)
    }

    await markRead(notif.id)
    setConfirming(null)
    fetchNotifications()
  }

  async function handleDispute(notif) {
    if (!notif.match_id) return
    await supabase.from('matches').update({ status: 'disputed' }).eq('id', notif.match_id)
    await markRead(notif.id)
    fetchNotifications()
  }

  async function markRead(notifId) {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('player_id', player.id).eq('read', false)
    fetchNotifications()
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer', padding: 4, position: 'relative' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: '#9f1239', color: '#ffffff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #1e2b65',
          }}>
            {unreadCount}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12,
          width: 340, maxHeight: 440, overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          zIndex: 200
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #e8e8e4' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e2b65' }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: '#888', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Pending confirmations */}
          {pendingConfirms.length > 0 && (
            <div style={{ padding: '12px 16px', background: '#fff7ed', borderBottom: '0.5px solid #e8e8e4' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', fontFamily: 'sans-serif', marginBottom: 8, letterSpacing: '0.5px' }}>
                {pendingConfirms.length} GAME{pendingConfirms.length > 1 ? 'S' : ''} NEED YOUR CONFIRMATION
              </div>
              {pendingConfirms.map(n => (
                <div key={n.id} style={{
                  background: 'white', border: '1.5px solid #ea580c', borderRadius: 10,
                  padding: '10px 12px', marginBottom: 8
                }}>
                  <div style={{ fontSize: 12, color: '#555', fontFamily: 'sans-serif', lineHeight: 1.5, marginBottom: 8 }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDispute(n)}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 6,
                        background: 'white', border: '0.5px solid #9f1239',
                        color: '#9f1239', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'sans-serif'
                      }}
                    >
                      Dispute
                    </button>
                    <button
                      onClick={() => handleConfirm(n)}
                      disabled={confirming === n.id}
                      style={{
                        flex: 2, padding: '6px 0', borderRadius: 6,
                        background: confirming === n.id ? '#888' : '#16a34a', border: 'none',
                        color: '#ffffff', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'sans-serif'
                      }}
                    >
                      {confirming === n.id ? 'Confirming...' : '✓ Confirm'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other notifications */}
          {notifications.filter(n => n.type !== 'confirm_match' || n.read).length > 0 ? (
            notifications.filter(n => n.type !== 'confirm_match' || n.read).map(n => (
              <div key={n.id} onClick={() => { if (!n.read) markRead(n.id) }} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 16px',
                background: n.read ? 'transparent' : 'rgba(30,43,101,0.03)',
                borderBottom: '0.5px solid #e8e8e4',
                cursor: n.read ? 'default' : 'pointer'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: n.type === 'verified' ? '#d1fae5' : n.type === 'confirm_match' ? '#fee2e2' : '#eef1f8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
                }}>
                  {n.type === 'verified' ? '✓' : n.type === 'confirm_match' ? '✓' : '●'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#333', fontFamily: 'sans-serif', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'sans-serif', marginTop: 3 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))
          ) : (
            pendingConfirms.length === 0 && (
              <div style={{ padding: '30px 16px', textAlign: 'center', fontSize: 13, color: '#888', fontFamily: 'sans-serif' }}>
                No notifications yet
              </div>
            )
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              onClick={() => { setShowDropdown(false); onNavigate('record') }}
              style={{ padding: '10px 16px', textAlign: 'center', borderTop: '0.5px solid #e8e8e4', fontSize: 12, color: '#1e2b65', fontWeight: 600, fontFamily: 'sans-serif', cursor: 'pointer' }}
            >
              View All in Record Tab →
            </div>
          )}
        </div>
      )}
    </div>
  )
}
