import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

export default function NotificationBell({ player, onNavigate, refreshPlayer, onCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const dropdownRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const pendingConfirms = notifications.filter(n => n.type === 'confirm_match' && !n.read)

  useEffect(() => {
    if (onCountChange) onCountChange(unreadCount)
  }, [unreadCount])

  useEffect(() => {
    if (player?.id) {
      fetchNotifications()
    }
    const interval = setInterval(() => { if (player?.id) fetchNotifications() }, 30000)
    return () => clearInterval(interval)
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: '#DC2626', color: '#ffffff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #0F172A',
          }}>
            {unreadCount}
          </div>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'fixed', top: 56, left: 8, right: 8,
          background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 12,
          maxWidth: 400, maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          zIndex: 200
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #e8e8e4' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: '#888', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Mark all read
              </button>
            )}
          </div>

          {pendingConfirms.length > 0 && (
            <div style={{ padding: '12px 16px', background: '#fff7ed', borderBottom: '0.5px solid #e8e8e4' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', fontFamily: "'DM Sans', sans-serif", marginBottom: 8, letterSpacing: '0.5px' }}>
                {pendingConfirms.length} GAME{pendingConfirms.length > 1 ? 'S' : ''} NEED YOUR CONFIRMATION
              </div>
              {pendingConfirms.map(n => (
                <div key={n.id} style={{
                  background: 'white', border: '1.5px solid #ea580c', borderRadius: 10,
                  padding: '10px 12px', marginBottom: 8
                }}>
                  <div style={{ fontSize: 12, color: '#555', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 8 }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDispute(n)}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 6,
                        background: 'white', border: '0.5px solid #DC2626',
                        color: '#DC2626', fontSize: 11, fontWeight: 700,
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
                        background: confirming === n.id ? '#888' : '#065F46', border: 'none',
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
                background: n.read ? 'transparent' : 'rgba(15,23,42,0.03)',
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
                  <div style={{ fontSize: 12, color: '#333', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: '#aaa', fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))
          ) : (
            pendingConfirms.length === 0 && (
              <div style={{ padding: '30px 16px', textAlign: 'center', fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>
                No notifications yet
              </div>
            )
          )}

          {notifications.length > 0 && (
            <div
              onClick={() => { setShowDropdown(false); onNavigate('record') }}
              style={{ padding: '10px 16px', textAlign: 'center', borderTop: '0.5px solid #e8e8e4', fontSize: 12, color: '#0F172A', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
            >
              View All in Record Tab →
            </div>
          )}
        </div>
      )}
    </div>
  )
}