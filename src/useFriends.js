import { useState, useEffect, useCallback, useId } from 'react'
import { supabase } from './supabase'

/**
 * useFriends — mutual friendship system
 * Returns: { friends, pending, sent, friendIds, loading, sendRequest, acceptRequest, declineRequest, removeFriend, refresh }
 *
 * friends   = accepted friendships (array of player objects with friendship metadata)
 * pending   = incoming requests waiting for your acceptance
 * sent      = outgoing requests you've sent
 * friendIds = Set of player IDs who are accepted friends (fast lookup)
 */
export default function useFriends(playerId, playerName) {
  const [friendships, setFriendships] = useState([])
  const [loading, setLoading] = useState(true)
  // Unique per-hook-instance ID. Without this, two callers of useFriends with the
  // same playerId (e.g. Social + Players) would create a Supabase channel with the
  // same name, and the second .on('postgres_changes', …) after .subscribe() throws:
  //   "cannot add postgres_changes callbacks for realtime:friendships-<uid> after subscribe()"
  // That uncaught error crashes the Social tab (blank page on web, error screen on iOS).
  const instanceId = useId()

  const fetchFriendships = useCallback(async () => {
    if (!playerId) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${playerId},receiver_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
      if (error) console.warn('[MahjRank] friendships query error:', error.message)
      setFriendships(data || [])
    } catch (err) {
      console.error('[MahjRank] fetchFriendships failed:', err)
      setFriendships([])
    }
    setLoading(false)
  }, [playerId])

  useEffect(() => {
    fetchFriendships()
    // Realtime subscription
    if (!playerId) return
    let channel
    try {
      channel = supabase
        .channel('friendships-' + playerId + '-' + instanceId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'friendships',
        }, () => fetchFriendships())
        .subscribe((status, err) => {
          if (err) console.warn('[MahjRank] friendships realtime error:', err.message)
        })
    } catch (err) {
      console.warn('[MahjRank] friendships channel setup failed:', err)
    }
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [playerId, fetchFriendships, instanceId])

  // Accepted friends
  const friends = friendships
    .filter(f => f.status === 'accepted')
    .map(f => ({
      ...f,
      friendId: f.requester_id === playerId ? f.receiver_id : f.requester_id,
    }))

  // Incoming pending requests (others → me)
  const pending = friendships
    .filter(f => f.status === 'pending' && f.receiver_id === playerId)

  // Outgoing sent requests (me → others)
  const sent = friendships
    .filter(f => f.status === 'pending' && f.requester_id === playerId)

  // Fast lookup set
  const friendIds = new Set(friends.map(f => f.friendId))

  // Get friendship status with a specific player
  function getStatus(targetId) {
    if (!targetId || targetId === playerId) return null
    const f = friendships.find(
      fs => (fs.requester_id === playerId && fs.receiver_id === targetId) ||
            (fs.requester_id === targetId && fs.receiver_id === playerId)
    )
    if (!f) return 'none'
    if (f.status === 'accepted') return 'friends'
    if (f.requester_id === playerId) return 'sent'
    return 'pending' // they sent to us
  }

  async function sendRequest(receiverId) {
    if (!playerId || receiverId === playerId) return
    const existing = friendships.find(
      f => (f.requester_id === playerId && f.receiver_id === receiverId) ||
           (f.requester_id === receiverId && f.receiver_id === playerId)
    )
    if (existing) return
    try {
      await supabase.from('friendships').insert({ requester_id: playerId, receiver_id: receiverId, status: 'pending' })
      const name = playerName || 'Someone'
      await supabase.from('notifications').insert({ player_id: receiverId, type: 'friend_request', message: `${name} sent you a friend request`, read: false })
      fetchFriendships()
    } catch (err) { console.error('[MahjRank] sendRequest failed:', err) }
  }

  async function acceptRequest(requesterId) {
    try {
      await supabase.from('friendships').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('requester_id', requesterId).eq('receiver_id', playerId)
      const name = playerName || 'Someone'
      await supabase.from('notifications').insert({ player_id: requesterId, type: 'friend_accepted', message: `${name} accepted your friend request!`, read: false })
      fetchFriendships()
    } catch (err) { console.error('[MahjRank] acceptRequest failed:', err) }
  }

  async function declineRequest(requesterId) {
    try {
      await supabase.from('friendships').delete().eq('requester_id', requesterId).eq('receiver_id', playerId)
      fetchFriendships()
    } catch (err) { console.error('[MahjRank] declineRequest failed:', err) }
  }

  async function removeFriend(targetId) {
    try {
      await supabase.from('friendships').delete().or(`and(requester_id.eq.${playerId},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${playerId})`)
      fetchFriendships()
    } catch (err) { console.error('[MahjRank] removeFriend failed:', err) }
  }

  return {
    friends,
    pending,
    sent,
    friendIds,
    loading,
    getStatus,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refresh: fetchFriendships,
  }
}
