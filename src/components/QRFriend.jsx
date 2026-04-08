import { useState, useEffect, useRef, useCallback } from 'react'
import jsQR from 'jsqr'
import { supabase } from '../supabase'
import { C, fonts, shadows } from '../theme'
import useFriends from '../useFriends'

/**
 * QRFriend — QR-code-based friend adding
 *
 * Two modals:
 * 1. "My Code" — shows a QR code + short friend code for your player ID
 * 2. "Add Friend" — opens camera to scan a QR code, with manual code fallback
 *
 * QR encodes: mahjrank://friend/{playerId}
 * Friend code: first 8 chars of player UUID (displayed for manual entry)
 */

// ── QR Code Generator (SVG-based, no dependencies) ──
// Minimal QR encoder for alphanumeric data
function generateQRCodeURL(data, size = 200) {
  // Use a free QR code API — works offline-first with caching
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=FAFAF9&color=1C1917&margin=1`
}

// ── My Code Modal ──
export function MyCodeModal({ player, onClose }) {
  const friendCode = player?.id?.substring(0, 8)?.toUpperCase() || ''
  const qrData = `mahjrank://friend/${player?.id}`
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard?.writeText(friendCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(28,25,23,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FAFAF9', borderRadius: 20, padding: '32px 24px',
        maxWidth: 340, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(28,25,23,0.25)',
      }}>
        {/* Header */}
        <div style={{ fontSize: 34, marginBottom: 8 }}>📱</div>
        <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.midnight, marginBottom: 4 }}>
          My Friend Code
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.slate, marginBottom: 24 }}>
          Show this to a friend to add you
        </div>

        {/* QR Code */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 20,
          border: `1px solid ${C.border}`, marginBottom: 20,
          display: 'inline-block',
        }}>
          <img
            src={generateQRCodeURL(qrData, 200)}
            alt="Your QR Code"
            width={200}
            height={200}
            style={{ display: 'block', borderRadius: 8 }}
          />
        </div>

        {/* Friend Code */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: C.slateMd, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Or share your code
          </div>
          <button onClick={copyCode} style={{
            background: 'white', border: `2px dashed ${C.border}`,
            borderRadius: 12, padding: '14px 24px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              fontFamily: fonts.mono, fontSize: 22, fontWeight: 700,
              color: C.midnight, letterSpacing: 3,
            }}>
              {friendCode}
            </span>
            <span style={{ fontSize: 13, color: copied ? C.jade : C.slateLt }}>
              {copied ? '✓ Copied!' : '📋'}
            </span>
          </button>
        </div>

        {/* Player Name */}
        <div style={{
          background: 'rgba(22,101,52,0.06)', borderRadius: 10, padding: '10px 16px',
          fontFamily: fonts.body, fontSize: 14, color: C.jade, fontWeight: 600, marginBottom: 20,
        }}>
          {player?.name}
        </div>

        {/* Close */}
        <button onClick={onClose} style={{
          width: '100%', padding: 14, borderRadius: 12,
          background: C.midnight, color: 'white', border: 'none',
          fontFamily: fonts.heading, fontSize: 16, fontWeight: 700,
          cursor: 'pointer',
        }}>
          Done
        </button>
      </div>
    </div>
  )
}

// ── Add Friend (Scanner) Modal ──
export function AddFriendModal({ player, onClose, onAdded }) {
  const [mode, setMode] = useState('choose') // 'choose' | 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('')
  const [status, setStatus] = useState(null) // null | 'searching' | 'found' | 'sent' | 'error' | 'already' | 'self'
  const [foundPlayer, setFoundPlayer] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scanIntervalRef = useRef(null)
  const { sendRequest, getStatus } = useFriends(player?.id, player?.name)

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  function handleScannedValue(value) {
    if (typeof value !== 'string') return false
    if (value.startsWith('mahjrank://friend/')) {
      const id = value.replace('mahjrank://friend/', '')
      stopCamera()
      lookupAndAdd(id)
      return true
    }
    // Tolerate a bare UUID or 8-char code in case the QR was generated elsewhere
    const trimmed = value.trim()
    if (trimmed.length === 36 || trimmed.length === 8) {
      stopCamera()
      lookupAndAdd(trimmed)
      return true
    }
    return false
  }

  async function startCamera() {
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play().catch(() => {})
      }

      // jsQR-based scan loop — works on iOS WKWebView, Safari, Chrome.
      // BarcodeDetector is faster when present, but isn't shipped on iOS,
      // so we use jsQR as the primary path for consistency.
      const canvas = canvasRef.current || document.createElement('canvas')
      canvasRef.current = canvas
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      scanIntervalRef.current = setInterval(() => {
        const video = videoRef.current
        if (!video || video.readyState < 2 || !video.videoWidth) return
        try {
          const w = video.videoWidth
          const h = video.videoHeight
          if (canvas.width !== w) canvas.width = w
          if (canvas.height !== h) canvas.height = h
          ctx.drawImage(video, 0, 0, w, h)
          const imageData = ctx.getImageData(0, 0, w, h)
          const code = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' })
          if (code && code.data) handleScannedValue(code.data)
        } catch (_) {
          // Frame decode failed — keep trying
        }
      }, 250)
    } catch (err) {
      console.error('[MahjRank] camera start failed:', err)
      setMode('manual')
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
      setStatus({
        type: 'info',
        message: denied
          ? 'Camera access was denied. Enable it in Settings, or enter a friend code instead.'
          : 'Couldn\'t open the camera. Enter a friend code instead.',
      })
    }
  }

  async function lookupAndAdd(idOrCode) {
    setStatus({ type: 'searching' })

    try {
      // Try exact ID match first, then prefix match for short codes
      let targetPlayer = null

      if (idOrCode.length === 36) {
        // Full UUID
        const { data } = await supabase.from('players').select('id, name, avatar, elo, town').eq('id', idOrCode).single()
        targetPlayer = data
      } else {
        // Short code — match by ID prefix (case-insensitive)
        const code = idOrCode.toLowerCase()
        const { data } = await supabase.from('players').select('id, name, avatar, elo, town')
        if (data) {
          targetPlayer = data.find(p => p.id.substring(0, 8).toLowerCase() === code)
        }
      }

      if (!targetPlayer) {
        setStatus({ type: 'error', message: 'No player found with that code. Double-check and try again.' })
        setFoundPlayer(null)
        return
      }

      if (targetPlayer.id === player?.id) {
        setStatus({ type: 'self', message: 'That\'s your own code!' })
        setFoundPlayer(null)
        return
      }

      setFoundPlayer(targetPlayer)

      // Check existing friendship status
      const friendStatus = getStatus(targetPlayer.id)
      if (friendStatus === 'friends') {
        setStatus({ type: 'already', message: 'You\'re already friends!' })
        return
      }
      if (friendStatus === 'sent') {
        setStatus({ type: 'already', message: 'Friend request already sent!' })
        return
      }
      if (friendStatus === 'pending') {
        setStatus({ type: 'found' })
        return
      }

      setStatus({ type: 'found' })
    } catch (err) {
      console.error('[MahjRank] lookupAndAdd failed:', err)
      setStatus({ type: 'error', message: 'Error looking up player. Please try again.' })
      setFoundPlayer(null)
    }
  }

  async function handleSendRequest() {
    if (!foundPlayer) return
    try {
      await sendRequest(foundPlayer.id)
      setStatus({ type: 'sent' })
      if (onAdded) onAdded()
    } catch (err) {
      console.error('[MahjRank] handleSendRequest failed:', err)
      setStatus({ type: 'error', message: 'Failed to send friend request. Please try again.' })
    }
  }

  function handleManualSubmit() {
    const code = manualCode.trim()
    if (code.length < 8) return
    lookupAndAdd(code)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(28,25,23,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FAFAF9', borderRadius: 20, padding: '32px 24px',
        maxWidth: 360, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(28,25,23,0.25)',
      }}>
        {/* Header */}
        <div style={{ fontSize: 34, marginBottom: 8 }}>👋</div>
        <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 800, color: C.midnight, marginBottom: 4 }}>
          Add a Friend
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.slate, marginBottom: 24 }}>
          Scan their QR code or enter their friend code
        </div>

        {/* ── Choose Mode ── */}
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={startCamera} style={{
              padding: '18px 16px', borderRadius: 14,
              background: C.jade, color: 'white', border: 'none',
              fontFamily: fonts.heading, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              boxShadow: shadows.jade,
            }}>
              <span style={{ fontSize: 24 }}>📷</span> Scan QR Code
            </button>
            <button onClick={() => setMode('manual')} style={{
              padding: '18px 16px', borderRadius: 14,
              background: 'white', color: C.midnight, border: `1px solid ${C.border}`,
              fontFamily: fonts.heading, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              boxShadow: shadows.sm,
            }}>
              <span style={{ fontSize: 24 }}>⌨️</span> Enter Code
            </button>
          </div>
        )}

        {/* ── Camera Mode ── */}
        {mode === 'camera' && (
          <div>
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              border: `2px solid ${C.jade}`, marginBottom: 16,
              position: 'relative', background: '#000',
            }}>
              <video
                ref={videoRef}
                style={{ width: '100%', display: 'block', minHeight: 240 }}
                playsInline
                muted
              />
              {/* Scan overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 180, height: 180,
                  border: '3px solid rgba(255,255,255,0.7)',
                  borderRadius: 16,
                }} />
              </div>
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.slate, marginBottom: 16 }}>
              Point your camera at their QR code
            </div>
            <button onClick={() => { stopCamera(); setMode('manual') }} style={{
              background: 'none', border: 'none', color: C.jade,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', textDecoration: 'underline',
            }}>
              Enter code manually instead
            </button>
          </div>
        )}

        {/* ── Manual Code Entry ── */}
        {mode === 'manual' && !foundPlayer && (
          <div>
            {status?.type === 'info' && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                fontFamily: fonts.body, fontSize: 13, color: C.goldDk,
              }}>
                {status.message}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Enter 8-character code"
                value={manualCode}
                onChange={e => {
                  setManualCode(e.target.value.toUpperCase())
                  setStatus(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                maxLength={8}
                autoFocus
                style={{
                  width: '100%', padding: '16px', borderRadius: 12,
                  border: `2px solid ${manualCode.length === 8 ? C.jade : C.border}`,
                  fontFamily: fonts.mono, fontSize: 24, fontWeight: 700,
                  textAlign: 'center', letterSpacing: 4,
                  color: C.midnight, background: 'white',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
            </div>

            {status?.type === 'error' && (
              <div style={{
                background: 'rgba(225,29,72,0.06)', border: `1px solid rgba(225,29,72,0.15)`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                fontFamily: fonts.body, fontSize: 13, color: C.crimson,
              }}>
                {status.message}
              </div>
            )}
            {status?.type === 'self' && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                fontFamily: fonts.body, fontSize: 14, color: C.goldDk, fontWeight: 600,
              }}>
                😄 {status.message}
              </div>
            )}
            {status?.type === 'searching' && (
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: C.slate, marginBottom: 16 }}>
                Looking up player...
              </div>
            )}

            <button
              onClick={handleManualSubmit}
              disabled={manualCode.length < 8 || status?.type === 'searching'}
              style={{
                width: '100%', padding: 14, borderRadius: 12,
                background: manualCode.length === 8 ? C.jade : C.cloudDk,
                color: manualCode.length === 8 ? 'white' : C.slateLt,
                border: 'none', fontFamily: fonts.heading, fontSize: 16,
                fontWeight: 700, cursor: manualCode.length === 8 ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              Look Up Player
            </button>
          </div>
        )}

        {/* ── Found Player ── */}
        {foundPlayer && (
          <div>
            <div style={{
              background: 'white', borderRadius: 14, padding: 20,
              border: `1px solid ${C.border}`, marginBottom: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              {/* Avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: C.jade,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: foundPlayer.avatar ? 30 : 22, fontWeight: 700,
                fontFamily: fonts.heading,
              }}>
                {foundPlayer.avatar || foundPlayer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.midnight }}>
                  {foundPlayer.name}
                </div>
                {foundPlayer.town && (
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: C.slate, marginTop: 2 }}>
                    📍 {foundPlayer.town}
                  </div>
                )}
              </div>
              <div style={{
                fontFamily: fonts.mono, fontSize: 14, fontWeight: 600, color: C.jade,
                background: 'rgba(22,101,52,0.06)', padding: '4px 12px', borderRadius: 8,
              }}>
                Elo {Math.round(foundPlayer.elo || 800)}
              </div>
            </div>

            {status?.type === 'already' && (
              <div style={{
                background: 'rgba(22,101,52,0.06)', borderRadius: 10, padding: '12px 14px',
                marginBottom: 16, fontFamily: fonts.body, fontSize: 14,
                color: C.jade, fontWeight: 600,
              }}>
                ✓ {status.message}
              </div>
            )}

            {status?.type === 'sent' && (
              <div style={{
                background: 'rgba(22,101,52,0.06)', borderRadius: 10, padding: '12px 14px',
                marginBottom: 16, fontFamily: fonts.body, fontSize: 15,
                color: C.jade, fontWeight: 700,
              }}>
                ✓ Friend request sent!
              </div>
            )}

            {status?.type === 'found' && (
              <button onClick={handleSendRequest} style={{
                width: '100%', padding: 14, borderRadius: 12, marginBottom: 12,
                background: C.jade, color: 'white', border: 'none',
                fontFamily: fonts.heading, fontSize: 16, fontWeight: 700,
                cursor: 'pointer', boxShadow: shadows.jade,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 20 }}>👋</span> Send Friend Request
              </button>
            )}

            <button onClick={() => {
              setFoundPlayer(null)
              setStatus(null)
              setManualCode('')
              setMode('choose')
            }} style={{
              width: '100%', padding: 12, borderRadius: 12,
              background: 'white', color: C.slate, border: `1px solid ${C.border}`,
              fontFamily: fonts.body, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginBottom: status?.type === 'sent' ? 0 : 8,
            }}>
              {status?.type === 'sent' ? 'Add Another Friend' : 'Try a Different Code'}
            </button>
          </div>
        )}

        {/* Close button (always visible) */}
        {(mode === 'choose' || mode === 'camera' || (!foundPlayer && mode === 'manual')) && (
          <button onClick={onClose} style={{
            width: '100%', padding: 14, borderRadius: 12, marginTop: 12,
            background: C.midnight, color: 'white', border: 'none',
            fontFamily: fonts.heading, fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
          }}>
            Close
          </button>
        )}
        {foundPlayer && (
          <button onClick={onClose} style={{
            width: '100%', padding: 14, borderRadius: 12, marginTop: 8,
            background: C.midnight, color: 'white', border: 'none',
            fontFamily: fonts.heading, fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
          }}>
            Done
          </button>
        )}
      </div>
    </div>
  )
}
