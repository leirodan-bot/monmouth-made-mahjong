import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export default function PushNotifications({ player }) {
  const [permission, setPermission] = useState(Notification.permission)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!player?.id || !VAPID_PUBLIC_KEY) return
    checkExistingSubscription()
  }, [player?.id])

  async function checkExistingSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      // Check if it's stored in Supabase
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('player_id', player.id)
        .eq('endpoint', sub.endpoint)
        .limit(1)
      setSubscribed(data && data.length > 0)
    }
  }

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const subJson = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        player_id: player.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }, { onConflict: 'player_id,endpoint' })

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    }
    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete()
          .eq('player_id', player.id)
          .eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    }
    setLoading(false)
  }

  // Don't render if browser doesn't support push or no VAPID key configured
  if (!('PushManager' in window) || !VAPID_PUBLIC_KEY) return null

  if (permission === 'denied') return null

  return { subscribe, unsubscribe, subscribed, loading, permission }
}

// Hook version for use in ProfileSection
export function usePushNotifications(player) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const supported = typeof window !== 'undefined' && 'PushManager' in window && !!VAPID_PUBLIC_KEY

  useEffect(() => {
    if (!player?.id || !supported) return
    checkExisting()
  }, [player?.id])

  async function checkExisting() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('player_id', player.id)
        .eq('endpoint', sub.endpoint)
        .limit(1)
      setSubscribed(data && data.length > 0)
    }
  }

  async function subscribe() {
    if (!supported) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const subJson = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        player_id: player.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }, { onConflict: 'player_id,endpoint' })
      setSubscribed(true)
    } catch (err) { console.error('Push subscribe failed:', err) }
    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete()
          .eq('player_id', player.id).eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) { console.error('Push unsubscribe failed:', err) }
    setLoading(false)
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
