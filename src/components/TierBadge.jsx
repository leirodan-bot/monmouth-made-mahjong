// Shared TierBadge component — single source of truth
// Used by MobileShell (home tab) and ProfileSection
import { getTier } from '../eloUtils'

const TIER_EMOJIS = { Novice: '🀆', Beginner: '🌸', Skilled: '🎋', Expert: '🐲', Master: '🐉', Grandmaster: '🐉🐲' }

export default function TierBadge({ elo }) {
  const tier = getTier(elo)
  const emoji = TIER_EMOJIS[tier.name]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '2rem' }}>{emoji}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: tier.bg, color: tier.textColor,
        padding: '4px 12px', borderRadius: 20,
        fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
      }}>
        {tier.name}
      </span>
    </div>
  )
}
