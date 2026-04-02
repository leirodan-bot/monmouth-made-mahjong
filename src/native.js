/**
 * MahjRank — Native iOS Bridge
 * Wraps Capacitor plugins with graceful web fallbacks.
 * Import { native } from './native' anywhere in the app.
 */

import { Capacitor } from '@capacitor/core'

// ── Platform detection ──
export const isNative = Capacitor.isNativePlatform()
export const isIOS = Capacitor.getPlatform() === 'ios'
export const isWeb = Capacitor.getPlatform() === 'web'

// ── Haptics ──
let HapticsPlugin = null
async function loadHaptics() {
  if (!isNative) return null
  if (!HapticsPlugin) {
    const mod = await import('@capacitor/haptics')
    HapticsPlugin = mod.Haptics
  }
  return HapticsPlugin
}

export const haptics = {
  /** Light tap — button presses, selections */
  async light() {
    const h = await loadHaptics()
    h?.impact({ style: 'LIGHT' })
  },
  /** Medium tap — confirmations, toggles */
  async medium() {
    const h = await loadHaptics()
    h?.impact({ style: 'MEDIUM' })
  },
  /** Heavy tap — Elo changes, match recorded */
  async heavy() {
    const h = await loadHaptics()
    h?.impact({ style: 'HEAVY' })
  },
  /** Success — match confirmed, badge earned */
  async success() {
    const h = await loadHaptics()
    h?.notification({ type: 'SUCCESS' })
  },
  /** Warning — dispute filed */
  async warning() {
    const h = await loadHaptics()
    h?.notification({ type: 'WARNING' })
  },
  /** Error — validation failure */
  async error() {
    const h = await loadHaptics()
    h?.notification({ type: 'ERROR' })
  },
}

// ── Status Bar ──
let StatusBarPlugin = null
async function loadStatusBar() {
  if (!isNative) return null
  if (!StatusBarPlugin) {
    const mod = await import('@capacitor/status-bar')
    StatusBarPlugin = mod.StatusBar
  }
  return StatusBarPlugin
}

export const statusBar = {
  async setLight() {
    const sb = await loadStatusBar()
    sb?.setStyle({ style: 'LIGHT' })
  },
  async setDark() {
    const sb = await loadStatusBar()
    sb?.setStyle({ style: 'DARK' })
  },
  async hide() {
    const sb = await loadStatusBar()
    sb?.hide()
  },
  async show() {
    const sb = await loadStatusBar()
    sb?.show()
  },
}

// ── Push Notifications ──
let PushPlugin = null
async function loadPush() {
  if (!isNative) return null
  if (!PushPlugin) {
    const mod = await import('@capacitor/push-notifications')
    PushPlugin = mod.PushNotifications
  }
  return PushPlugin
}

export const push = {
  /**
   * Request permission and register for push notifications.
   * Returns the APNs device token (string) or null if denied/web.
   */
  async register() {
    const pn = await loadPush()
    if (!pn) return null

    const permission = await pn.requestPermissions()
    if (permission.receive !== 'granted') return null

    await pn.register()

    return new Promise((resolve) => {
      pn.addListener('registration', (token) => {
        resolve(token.value)
      })
      pn.addListener('registrationError', () => {
        resolve(null)
      })
    })
  },

  /**
   * Listen for incoming push notifications while app is open.
   * callback receives { title, body, data }.
   */
  async onReceived(callback) {
    const pn = await loadPush()
    if (!pn) return
    pn.addListener('pushNotificationReceived', (notification) => {
      callback({
        title: notification.title,
        body: notification.body,
        data: notification.data,
      })
    })
  },

  /**
   * Listen for push notification taps (app opened from notification).
   * callback receives { data }.
   */
  async onTapped(callback) {
    const pn = await loadPush()
    if (!pn) return
    pn.addListener('pushNotificationActionPerformed', (action) => {
      callback({ data: action.notification.data })
    })
  },
}

// ── Splash Screen ──
let SplashPlugin = null
async function loadSplash() {
  if (!isNative) return null
  if (!SplashPlugin) {
    const mod = await import('@capacitor/splash-screen')
    SplashPlugin = mod.SplashScreen
  }
  return SplashPlugin
}

export const splash = {
  async hide() {
    const s = await loadSplash()
    s?.hide()
  },
  async show() {
    const s = await loadSplash()
    s?.show()
  },
}

// ── In-App Browser (for OAuth) ──
let BrowserPlugin = null
async function loadBrowser() {
  if (!isNative) return null
  if (!BrowserPlugin) {
    const mod = await import('@capacitor/browser')
    BrowserPlugin = mod.Browser
  }
  return BrowserPlugin
}

export const browser = {
  async open(url) {
    const b = await loadBrowser()
    if (b) {
      await b.open({ url })
    } else {
      window.open(url, '_blank')
    }
  },
  async close() {
    const b = await loadBrowser()
    b?.close()
  },
}

// ── Deep Link Listener (for OAuth callback) ──
let AppPlugin = null
async function loadApp() {
  if (!isNative) return null
  if (!AppPlugin) {
    const mod = await import('@capacitor/app')
    AppPlugin = mod.App
  }
  return AppPlugin
}

export const appListener = {
  /**
   * Listen for deep link URL opens (e.g. OAuth callback).
   * callback receives the full URL string.
   */
  async onUrlOpen(callback) {
    const app = await loadApp()
    if (!app) return
    app.addListener('appUrlOpen', (event) => {
      callback(event.url)
    })
  },
}

// ── Convenience: single import ──
export const native = {
  isNative,
  isIOS,
  isWeb,
  haptics,
  statusBar,
  push,
  splash,
  browser,
  appListener,
}
