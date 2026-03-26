// ============================================
// MahjRank Design Tokens — Single Source of Truth
// ============================================
// Warm stone palette — approved redesign March 2026
// Import in every component: import { C, fonts, shadows } from '../theme'

export const C = {
  // Primary — warm jade green
  jade: '#166534',        // green-800, slightly warmer than old #065F46
  jadeLt: '#16A34A',      // green-600, brighter and more alive

  // Accent — rose (replaces crimson for warmth)
  crimson: '#E11D48',     // rose-600 — kept as 'crimson' for backward compat
  rose: '#E11D48',        // alias — preferred name going forward
  roseLt: '#FB7185',      // rose-400, for hover states

  // Gold — unchanged
  gold: '#F59E0B',
  goldDk: '#D97706',

  // Dark backgrounds — warm stone instead of cool navy
  midnight: '#1C1917',    // stone-900, warm charcoal (was #0F172A)
  charcoal: '#1C1917',    // alias — preferred name
  ink: '#292524',          // stone-800, warm dark surface (was #1E293B)

  // Light backgrounds — warm cream
  cloud: '#F0EDEB',       // warm cream bg — enough contrast for white cards
  cream: '#F0EDEB',       // alias
  cloudLt: '#FAFAF9',     // stone-50, lighter inner bg
  creamLt: '#FAFAF9',     // alias
  cloudDk: '#E7E5E4',     // stone-200, slightly darker variant

  // Text grays — warm stone tones
  slate: '#78716C',       // stone-500, primary secondary text — PASSES AA on white (4.7:1)
  warmGray: '#78716C',    // alias
  // ACCESSIBILITY: slateLt FAILS AA at small sizes (2.8:1 on white).
  // Use slateMd for any readable text < 18px.
  slateLt: '#A8A29E',     // stone-400, decorative/large text only
  warmGrayLt: '#A8A29E',  // alias
  slateMd: '#57534E',     // stone-600, accessible alt — PASSES AA (5.6:1 on white)

  // Borders — warm
  border: '#D6D3D1',      // stone-300, primary border
  borderLt: '#E7E5E4',    // stone-200, subtle inner dividers

  white: '#FFFFFF',
}

export const fonts = {
  heading: "'Outfit', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
}

export const shadows = {
  sm: '0 1px 4px rgba(28,25,23,0.04)',
  md: '0 2px 10px rgba(28,25,23,0.08)',       // standard card
  lg: '0 2px 16px rgba(28,25,23,0.10)',        // prominent card (welcome, spotlight)
  xl: '0 8px 30px rgba(28,25,23,0.12)',        // hover lift
  rose: '0 4px 20px rgba(225,29,72,0.25)',     // rose CTA glow
  roseHover: '0 8px 30px rgba(225,29,72,0.3)', // rose CTA hover
  jade: '0 2px 8px rgba(22,101,52,0.08)',      // jade accent
}

// Standard card style — clean borders, shadow elevation, NO colored accent
export function card(extra = {}) {
  return {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    boxShadow: shadows.md,
    ...extra,
  }
}

// Prominent card — stronger shadow for hero/welcome cards
export function cardLg(extra = {}) {
  return {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    boxShadow: shadows.lg,
    ...extra,
  }
}

// Status alert card — ONLY use for pending actions, alerts, warnings
// This is the only place accent left borders should appear
export function statusCard(accent, extra = {}) {
  return {
    background: C.white,
    borderTop: `1px solid ${C.border}`,
    borderRight: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accent}`,
    borderRadius: 16,
    boxShadow: shadows.md,
    ...extra,
  }
}

// Legacy alias — prefer card() or statusCard() going forward
export function accentCard(accent, extra = {}) {
  return statusCard(accent, extra)
}

export function accentLink(accent) {
  return {
    width: '100%',
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.charcoal,
    cursor: 'pointer',
    boxShadow: shadows.sm,
  }
}
