import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { C, fonts, shadows } from '../theme'

export default function NotificationBell({ player, onNavigate, refreshPlayer, onCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const dropdownRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const pendingConfirms = notifications.filter(n => n.type === 'confirm_match' && !n.read)

  useEffect(() => {
    if (onCountChange) onCountChange({ pending: pendingConfirms.length, total: unreadCount })
  }, [pendingConfirms.length, unreadCount])

  useEffect(() => {
    if (player?.id) {
      fetchNotifications()
    }
    const interval = setInterval(() => { if (player?.id) fetchNotifications() }, 30000)

    // Realtime subscription for instant notification delivery
    let channel = null
    if (player?.id) {
      channel = supabase
        .channel('notifications-' + player.id)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `player_id=eq.${player.id}`
        }, () => fetchNotifications())
        .subscribe()
    }

    return () => {
      clearInterval(interval)
      if (channel) supabase.removeChannel(channel)
    }
  }, [player?.id])

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
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20)
    
    const notifs = data || []
    
    const unreadConfirms = notifs.filter(n => n.type === 'confirm_match' && !n.read && n.match_id)
    if (unreadConfirms.length > 0) {
      const matchIds = [...new Set(unreadConfirms.map(n => n.match_id))]
      const { data: matches } = await supabase
        .from('matches')
        .select('id, status')
        .in('id', matchIds)
      
      if (matches) {
        const confirmedIds = matches.filter(m => m.status !== 'pending').map(m => m.id)
        if (confirmedIds.length > 0) {
          const staleNotifIds = unreadConfirms
            .filter(n => confirmedIds.includes(n.match_id))
            .map(n => n.id)
          
          for (const nid of staleNotifIds) {
            try {
              await supabase.rpc('mark_notification_read', {
                p_notification_id: nid,
                p_player_id: player.id
              })
            } catch (err) {
              console.error('Auto-clear failed:', err)
            }
          }
          
          const { data: freshData } = await supabase
            .from('notifications')
            .select('*')
            .eq('player_id', player.id)
      .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(20)
          setNotifications(freshData || [])
          return
        }
      }
    }
    
    setNotifications(notifs)
  }

  async function handleConfirm(notif) {
    if (!notif.match_id) return
    setConfirming(notif.id)

    try {
      const { data, error } = await supabase.rpc('confirm_game', {
        p_match_id: notif.match_id,
        p_player_id: player.id
      })

      if (error) {
        console.error('Confirm error:', error)
      } else {
        if (refreshPlayer) refreshPlayer()
      }
    } catch (err) {
      console.error('Confirm failed:', err)
    }

    setConfirming(null)
    await new Promise(resolve => setTimeout(resolve, 300))
    await fetchNotifications()
    
    setShowDropdown(false)
    onNavigate('home')
  }

  async function handleDispute(notif) {
    if (!notif.match_id) return

    try {
      await supabase.rpc('dispute_game', {
        p_match_id: notif.match_id,
        p_player_id: player.id
      })
    } catch (err) {
      console.error('Dispute failed:', err)
    }

    fetchNotifications()
    setShowDropdown(false)
    onNavigate('home')
  }

  async function markRead(notifId) {
    try {
      await supabase.rpc('mark_notification_read', {
        p_notification_id: notifId,
        p_player_id: player.id
      })
    } catch (err) {
      console.error('Mark read failed:', err)
    }
    await fetchNotifications()
  }

  async function markAllRead() {
    try {
      await supabase.rpc('mark_notifications_read', {
        p_player_id: player.id
      })
    } catch (err) {
      console.error('Mark all read failed:', err)
    }
    await fetchNotifications()
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer', padding: 4, position: 'relative' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: C.crimson, color: '#ffffff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid white',
          }}>
            {unreadCount}
          </div>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'fixed', top: 56, left: 8, right: 8,
          background: 'white', border: `1px solid ${C.border}`, borderRadius: 14,
          maxWidth: 400, maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(28,25,23,0.1)',
          zIndex: 200
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.midnight, fontFamily: "'Outfit', sans-serif" }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: C.slateMd, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Mark all read
              </button>
            )}
          </div>

          {pendingConfirms.length > 0 && (
            <div style={{ padding: '12px 16px', background: 'rgba(225,29,72,0.08)', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '1px' }}>
                {pendingConfirms.length} GAME{pendingConfirms.length > 1 ? 'S' : ''} NEED YOUR CONFIRMATION
              </div>
              {pendingConfirms.map(n => (
                <div key={n.id} style={{
                  background: 'white', borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${C.crimson}`,
                  padding: '10px 12px', marginBottom: 8,
                }}>
                  <div style={{ fontSize: 12, color: C.ink, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 8 }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDispute(n)}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 6,
                        background: 'white', border: `1px solid ${C.crimson}`,
                        color: C.crimson, fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                      }}
                    >
                      Dispute
                    </button>
                    <button
                      onClick={() => handleConfirm(n)}
                      disabled={confirming === n.id}
                      style={{
                        flex: 2, padding: '6px 0', borderRadius: 6,
                        background: confirming === n.id ? C.slateMd : C.jade, border: 'none',
                        color: '#ffffff', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                      }}
                    >
                      {confirming === n.id ? 'Confirming...' : '✓ Confirm'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.filter(n => n.type !== 'confirm_match' || n.read).length > 0 ? (
            notifications.filter(n => n.type !== 'confirm_match' || n.read).map(n => (
              <div key={n.id} onClick={() => { if (!n.read) markRead(n.id) }} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 16px',
                background: n.read ? 'transparent' : 'rgba(22,101,52,0.02)',
                borderBottom: `1px solid ${C.border}`,
                borderLeft: n.read ? 'none' : `3px solid ${C.jade}`,
                cursor: n.read ? 'default' : 'pointer'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: n.type === 'verified' ? 'rgba(22,101,52,0.08)' : n.type === 'confirm_match' ? 'rgba(225,29,72,0.06)' : n.type === 'follow' ? 'rgba(22,101,52,0.06)' : C.cloud,
                  color: n.type === 'verified' ? C.jade : n.type === 'confirm_match' ? C.crimson : n.type === 'follow' ? C.jade : C.slateMd,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
                }}>
                  {n.type === 'verified' ? '✓' : n.type === 'confirm_match' ? '✓' : n.type === 'follow' ? '👤' : '●'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.ink, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: C.slateMd, fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.crimson, flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))
          ) : (
            pendingConfirms.length === 0 && (
              <div style={{ padding: '30px 16px', textAlign: 'center', fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>
                No notifications yet
              </div>
            )
          )}

          {notifications.length > 0 && (
            <div
              onClick={async () => { await markAllRead(); setShowDropdown(false) }}
              style={{ padding: '10px 16px', textAlign: 'center', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.crimson, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
            >
              Clear All Notifications
            </div>
          )}
        </div>
      )}
    </div>
  )
}