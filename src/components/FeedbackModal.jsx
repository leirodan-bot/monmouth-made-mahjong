import { useState } from 'react'
import { supabase } from '../supabase'
import { C, fonts, shadows } from '../theme'

const CATEGORIES = [
  { value: 'bug',            label: 'Bug / Issue',    emoji: '🐞', color: C.crimson },
  { value: 'recommendation', label: 'Recommendation', emoji: '💡', color: C.gold    },
  { value: 'question',       label: 'Question',       emoji: '❓', color: C.jade    },
  { value: 'other',          label: 'Other',          emoji: '💬', color: C.slate   },
]

// Read the app version Vite injects at build time. Falls back to 'dev' so the
// row still inserts cleanly when running locally without an env value.
const APP_VERSION =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_VERSION) ||
  '1.1'

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'web'
}

export default function FeedbackModal({ player, session, onClose }) {
  const [category, setCategory] = useState('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState(null)

  const trimmed = message.trim()
  const canSubmit = !sending && trimmed.length >= 4 && trimmed.length <= 4000

  async function handleSubmit() {
    if (!canSubmit) return
    setSending(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('feedback').insert({
        player_id:    player?.id || null,
        player_name:  player?.name || null,
        player_email: player?.email || session?.user?.email || null,
        category,
        message:      trimmed,
        app_version:  APP_VERSION,
        platform:     detectPlatform(),
        user_agent:   typeof navigator !== 'undefined' ? navigator.userAgent : null,
      })
      if (insertError) throw insertError
      setSent(true)
    } catch (err) {
      console.error('[MahjRank] feedback submit failed:', err)
      setError('Could not save your feedback. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  const counterColor =
    trimmed.length === 0     ? C.slateLt :
    trimmed.length < 4       ? C.crimson :
    trimmed.length > 3800    ? C.crimson :
    trimmed.length > 3500    ? C.goldDk  :
                               C.slateMd

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 18, padding: 24,
          maxWidth: 420, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          fontFamily: fonts.body,
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 4px' }}>
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>🙏</div>
            <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>
              Thanks — got it.
            </div>
            <div style={{ fontSize: 14, color: C.slate, lineHeight: 1.5, marginBottom: 20 }}>
              Your feedback was sent to the MahjRank team. We read every message and we'll get back to you if a response is needed.
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: C.jade, color: 'white',
                fontFamily: fonts.heading, fontWeight: 700, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.midnight }}>
                  Support &amp; Feedback
                </div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 4, lineHeight: 1.45 }}>
                  Found a bug? Have an idea? Tell us — we read everything.
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'none', border: 'none', fontSize: 22, color: C.slate,
                  cursor: 'pointer', lineHeight: 1, padding: 4, marginLeft: 8,
                }}
              >
                ×
              </button>
            </div>

            {/* Category picker */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slateMd, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Category
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(c => {
                  const active = category === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 12px',
                        borderRadius: 12,
                        border: active ? `2px solid ${c.color}` : `1px solid ${C.border}`,
                        background: active ? `${c.color}10` : 'white',
                        color: active ? c.color : C.midnight,
                        fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message field */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slateMd, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Message
                </div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: counterColor }}>
                  {trimmed.length}/4000
                </div>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
                placeholder={
                  category === 'bug'
                    ? "What happened? What did you expect? Steps to reproduce help a lot."
                    : category === 'recommendation'
                    ? "What would make MahjRank better? Be as specific as you'd like."
                    : category === 'question'
                    ? "Ask away — we'll get back to you."
                    : "Tell us anything."
                }
                rows={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  fontFamily: fonts.body, fontSize: 14, lineHeight: 1.5,
                  color: C.midnight, resize: 'vertical',
                  outline: 'none',
                  background: '#FAFAF9',
                }}
                onFocus={(e) => { e.target.style.borderColor = C.jade; e.target.style.background = 'white' }}
                onBlur={(e)  => { e.target.style.borderColor = C.border; e.target.style.background = '#FAFAF9' }}
              />
            </div>

            {/* Identity note */}
            <div style={{ marginTop: 12, fontSize: 11, color: C.slateLt, lineHeight: 1.5 }}>
              Sent as <span style={{ color: C.slate, fontWeight: 600 }}>{player?.name || 'anonymous'}</span>
              {(player?.email || session?.user?.email) && (
                <> · <span style={{ color: C.slate }}>{player?.email || session?.user?.email}</span></>
              )}
              . We'll only contact you about this report.
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(225,29,72,0.06)', border: `1px solid rgba(225,29,72,0.2)`,
                color: C.crimson, fontSize: 12, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                style={{
                  padding: '12px 18px', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: 'white', color: C.slate,
                  fontFamily: fonts.body, fontSize: 14, fontWeight: 600,
                  cursor: sending ? 'default' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 1,
                  padding: '12px 18px', borderRadius: 12, border: 'none',
                  background: canSubmit ? C.jade : '#E7E5E4',
                  color: 'white',
                  fontFamily: fonts.heading, fontSize: 14, fontWeight: 700,
                  cursor: canSubmit ? 'pointer' : 'default',
                  boxShadow: canSubmit ? shadows.jade : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {sending ? 'Sending…' : 'Send Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
