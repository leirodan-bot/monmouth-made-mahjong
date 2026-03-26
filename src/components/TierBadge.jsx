// Shared TierBadge component — single source of truth
// Used by MobileShell (home tab) and ProfileSection
import { getTier } from '../eloUtils'
import { C } from '../theme'

import noviceBadge from '../assets/badges/novice.png'
import beginnerBadge from '../assets/badges/beginner.png'
import skilledBadge from '../assets/badges/skilled.png'
import expertBadge from '../assets/badges/expert.png'
import masterBadge from '../assets/badges/master.png'
import grandmasterBadge from '../assets/badges/grandmaster.png'

const TIER_IMAGES = {
  Novice: noviceBadge,
  Beginner: beginnerBadge,
  Skilled: skilledBadge,
  Expert: expertBadge,
  Master: masterBadge,
  Grandmaster: grandmasterBadge,
}

export default function TierBadge({ elo }) {
  const tier = getTier(elo)
  const img = TIER_IMAGES[tier.name]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {img && <img src={img} alt={tier.name} style={{ width: 36, height: 48, objectFit: 'contain' }} />}
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
