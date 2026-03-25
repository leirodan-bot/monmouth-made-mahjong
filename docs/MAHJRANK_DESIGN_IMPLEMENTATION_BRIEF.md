# MahjRank Design Implementation Brief

**For: Claude Code (repository access)**
**Date: March 25, 2026**
**Source: Design Research Report v2.0 + Full Site Redesign Prototype + Design Recommendations Visual Guide**

---

## Overview

This brief contains every design change needed to bring MahjRank's UI to production quality. It's based on a full codebase audit (22 components, 4,799 lines) and two visual prototypes that define the target design.

**Two reference files are included in this project:**
- `MahjRank_Full_Site_Redesign_Prototype.html` — Every major view redesigned (Landing, Dashboard, Rankings, Profile, Game Logging, Activity Feed, Header/Nav)
- `MahjRank_Design_Recommendations_Visual_Guide.html` — Interactive demos of animations, skeleton loaders, Elo calculator, dark mode, tier showcase, and club leaderboards

Open both files in a browser for visual reference while implementing.

**Implementation order:** Work through sections 1–8 in sequence. Each section targets specific files and can be committed independently.

---

## Brand Tokens (Reference)

Every component uses a local `C = {...}` object. Standardize ALL components to use this exact token set:

```javascript
const C = {
  // Core
  jade: '#065F46',
  jadeLt: '#059669',
  jadePale: '#ECFDF5',
  crimson: '#DC2626',
  crimsonLt: '#EF4444',
  crimsonPale: '#FEF2F2',
  gold: '#F59E0B',
  goldDk: '#D97706',
  goldPale: '#FFFBEB',
  midnight: '#0F172A',
  ink: '#1E293B',

  // Surfaces
  cloud: '#F8FAFC',
  white: '#FFFFFF',

  // Text
  slate: '#64748B',
  slateLt: '#94A3B8',
  slateXlt: '#CBD5E1',

  // Borders
  border: '#E2E8F0',
  borderLt: '#F1F5F9',
}
```

**Add these three pale colors** (`jadePale`, `crimsonPale`, `goldPale`) to every component's token set. They're used for badge backgrounds, feature card icon containers, and form states throughout the redesign.

---

## 1. Homepage Redesign

**File:** `src/components/Homepage.jsx` (466 lines)

### 1.1 Hero Section

**Current:** Logo image + tagline + two CTAs
**Target:** See Landing Page tab in prototype

Changes:
- Add a status pill above the headline: `<div>` with green dot + "Season 1 is live" text, styled as a pill with `background: rgba(6,95,70,0.12)`, `border: 1px solid rgba(6,95,70,0.2)`, `border-radius: 24px`
- Replace the `<img>` logo with text-based headline: "Your skill." on line 1, "Measured." on line 2 with gradient text (`background: linear-gradient(135deg, #059669, #F59E0B)`, `-webkit-background-clip: text`, `-webkit-text-fill-color: transparent`)
- Keep the subheadline text as-is, it's good
- Add a subtle grid texture overlay to the hero: `background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, `background-size: 60px 60px`, `opacity: 0.02`
- Keep the existing fadeUp animations and scroll indicator — they work well

### 1.2 Features Section

**Current:** 2-column grid with left logo block + right feature cards
**Target:** See prototype Features section

Changes:
- Remove the large logo block on the left (it's redundant — logo is in the hero)
- Switch to a 2x2 grid of feature cards (currently they're stacked on the right)
- Add pale color icon containers: `background: var(--jadePale)` / `var(--goldPale)` / `var(--crimsonPale)` with `border-radius: 12px`, `width: 48px`, `height: 48px`
- Keep the left accent border on each card — it works

### 1.3 NEW: Tier Showcase Section

**Add between How It Works and Leaderboard Preview sections**

This is a new section. See prototype "Tier Showcase" and the visual guide section 05.

```
Section label: "EARN YOUR RANK" (jade)
Title: "Six tiers. One goal."
Subtitle: "Win consistently, climb the ranks, and earn your place among the best."
```

6-column grid of tier cards (3-column on mobile). Each card has:
- Tier emoji (🀆, 🌸, 🎋, 🐲, 🐉, 🐉🐲)
- Tier name in tier color
- Elo range in JetBrains Mono
- Grandmaster card has midnight background with gold text

Use the actual tier images from `src/assets/badges/` instead of emojis if preferred — the prototype uses emojis as placeholders.

### 1.4 Leaderboard Preview

**Current:** Works well. Minor refinements:
- Add tier badge tags next to player names (the `tag` component from the prototype: `display: inline-flex`, `padding: 3px 10px`, `border-radius: 20px`, `font-size: 11px`)
- Add town names after player names in lighter color

### 1.5 CTA Section

**Current:** Good. One change:
- Change secondary CTA from "Learn About Elo Ratings" → link to `howitworks` tab (already does this, just keep it)

---

## 2. Header Redesign

**File:** `src/components/Header.jsx` (182 lines)

### 2.1 Logo Treatment

**Current:** Uses `mahjranklogolight2400.png` image at 76px height
**Target:** Consider replacing with text-based logo for crisper rendering:

```jsx
<span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800 }}>
  <span style={{ color: C.jade }}>Mahj</span>
  <span style={{ color: C.crimson }}>Rank</span>
</span>
```

This matches the prototype header. Keep the image as a fallback option — test both and pick whichever Dan prefers.

### 2.2 Navigation Tabs

**Current:** Good. Keep the jade active state with 3px bottom border, the crimson "Record Game" button, and the gradient accent bar.

**One refinement:** The active tab uses `color: '#065F46'` — make sure this is `C.jade` from the token set for consistency.

---

## 3. Mobile Shell Redesign

**File:** `src/components/MobileShell.jsx` (379 lines)

### 3.1 Bottom Navigation

**Current:** Flat bottom nav with emoji icons
**Target:** See Dashboard tab in prototype

Changes:
- Make the center Record button a **floating circle**: `width: 52px`, `height: 52px`, `border-radius: 50%`, `background: var(--crimson)`, `margin: -18px auto 0`, `box-shadow: 0 4px 16px rgba(220,38,38,0.3)`
- The "+" icon inside should be white, 24px, font-weight 300
- Active tab label should be `color: var(--jade)`, `font-weight: 700`
- Inactive tabs: `color: var(--slateLt)`

### 3.2 Home Dashboard

**Current:** Welcome card with stat boxes, pending banner, Record button, quick links
**Target:** Very close to prototype already. Refinements:

- Stat boxes: ensure `border-top: 3px solid {color}` is the accent, with `border-radius: 12px` and `background: var(--white)` (currently uses `C.cloudLt`)
- Quick link tiles: keep the 4px left accent border and current layout — it's good
- Pending confirmations banner: keep as-is, the gold styling works well

---

## 4. Rankings Redesign

**File:** `src/components/Rankings.jsx` (270 lines)

### 4.1 Table Layout

**Current:** Functional but could be sharper
**Target:** See Rankings tab in prototype

Changes:
- Add **Season / All-Time toggle** buttons at the top right: two pill buttons, active one gets `background: var(--midnight)`, `color: #fff`, inactive gets `border: 1.5px solid var(--border)`
- Wrap the table in a `.card` container with `border-radius: var(--radius-lg)` and `overflow: hidden`
- Add a **column header row** with uppercase labels: `#`, `Player`, `Tier`, `W – L`, `Elo`
- **#1 row highlight:** `border-left: 4px solid var(--gold)`, `background: rgba(245,158,11,0.02)`
- Other rows: `border-left: 4px solid transparent`
- Tier badges: use the `tag` pill component with tier-specific colors (tag-jade for Skilled, tag-bronze for Beginner, etc.)
- Player town in lighter color after name: `<span style={{ color: C.slateLt, marginLeft: 8 }}>{town}</span>`

---

## 5. Profile Redesign

**File:** `src/components/ProfileSection.jsx` (683 lines)

### 5.1 Elo Card

**Current:** Stat boxes in a grid
**Target:** See Profile tab in prototype — add a dark Elo card

Add a new **dark Elo card** above the existing stat boxes:
```
Background: var(--midnight)
Border-radius: 14px
Contents:
  - "ELO RATING" label in JetBrains Mono, 11px, slateLt
  - Rating number in JetBrains Mono, 42px, white, bold
  - Delta from last game: "▲ +6.5" in jade-lt or "▼ -2.1" in crimson
  - Mini sparkline (the existing EloSparkline component) positioned on the right side
  - Subtle radial gradient background effect
```

### 5.2 Badge Display

**Current:** Grid by category with earned/locked states
**Target:** Prototype shows earned badges with gold-pale background and gold border, locked with cloud background and low opacity

Changes:
- Earned badges: `background: var(--goldPale)`, `border: 1px solid rgba(245,158,11,0.2)`, full opacity
- Locked badges: `background: var(--cloud)`, `border: 1px solid var(--border)`, `opacity: 0.35`
- Category labels: `font-size: 11px`, `color: var(--slate)`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 1px`

### 5.3 Share Button

**Current:** Exists and works
**Target:** Style as full-width jade button: `background: var(--jade)`, `width: 100%`, `border-radius: 10px`, `padding: 14px`, centered text with 📤 icon

---

## 6. Game Logging Refinements

**File:** `src/components/RecordMatch.jsx` (593 lines)

### 6.1 Player Selection Cards

**Current:** Player names in a list
**Target:** See Game Logging tab in prototype

Changes:
- Each player should be a card with avatar initials circle + name
- Selected winner: `border: 2px solid var(--jade)`, `background: var(--jadePale)`, green "Winner ✓" badge on right
- Unselected players: `border: 1.5px solid var(--border)`, neutral avatar circle with `background: var(--cloud)`
- Avatar circles: `width: 36px`, `height: 36px`, `border-radius: 50%`, initials in 13px bold

### 6.2 Wall Game Toggle

**Current:** Checkbox-style
**Target:** Styled card with 🧱 emoji, gold-pale background, and toggle checkbox on the right

### 6.3 Badge Hint

**Current:** Small tooltip
**Target:** More prominent — see prototype badge hint at bottom of Game Logging view:
```
background: var(--goldPale)
border: 1px solid rgba(245,158,11,0.2)
border-radius: 8px
padding: 6px 12px
🏅 emoji + text
```

---

## 7. Activity Feed Refinements

**File:** `src/components/ActivityFeed.jsx` (187 lines)

### 7.1 Activity Cards

**Current:** List with Elo deltas
**Target:** See Activity Feed tab in prototype

Changes:
- Each activity item should be a `.card` with `.card-accent` (left border color varies by type):
  - Game win: `border-left-color: var(--jade)`
  - Badge earned: `border-left-color: var(--gold)`
  - Wall game: `border-left-color: var(--slateLt)`
  - Tier promotion: `border-left-color: var(--crimson)`
  - New member: `border-left-color: var(--jadeLt)`
- Layout: emoji icon (20px) | content (flex 1) | timestamp (right-aligned, slateLt, 11px)
- Elo deltas in a flex row below the description: jade for gains, crimson for losses, JetBrains Mono 13px

---

## 8. New Features (from Design Recommendations)

These are NEW functionality additions, not just styling changes.

### 8.1 Badge Celebration Toast

**Reference:** Visual Guide section 01

**Create new component:** `src/components/BadgeToast.jsx`

```
Behavior:
- When a badge is earned (after confirm_game RPC), show a toast that slides in from the top
- Auto-dismisses after 4 seconds
- Positioned: absolute, top 40px, left/right 16px, z-index 100

Styling:
- background: white
- border-radius: 14px
- border-left: 4px solid var(--gold)
- box-shadow: 0 12px 40px rgba(0,0,0,0.15)
- Contains: badge emoji (28px) | badge name (14px bold) + description (11px slate) | Share button (gold background)

Animation:
- Enter: opacity 0 → 1, translateY(-20px) → 0, scale(0.95) → 1
- Transition: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)
- Exit: reverse after 4 second delay
```

**Integration:** Import into `MobileShell.jsx` and `App.jsx`. Trigger after confirm_game RPC returns newly earned badges.

### 8.2 Rating Change Animation

**Reference:** Visual Guide section 02

**Where:** Wherever Elo is displayed after a game confirmation (MobileShell home card, ProfileSection, Rankings)

```
Behavior:
- When Elo updates, animate the number counting from old value to new value
- Duration: 600ms
- Easing: cubic ease-out (1 - Math.pow(1 - t, 3))
- Color: jade during gain animation, crimson during loss animation, returns to normal after 1.2s
- Glow: box-shadow pulse on the Elo container (0 0 30px rgba(6,95,70,0.15) for gain)

Implementation:
- Use requestAnimationFrame for smooth counting
- Store previous Elo in a ref, compare with new value
- Only animate when the delta is non-zero
```

### 8.3 Tier Promotion Celebration

**Reference:** Visual Guide section 03

**Create new component:** `src/components/TierPromotion.jsx`

```
Behavior:
- Triggers when a player's tier changes after Elo update
- Full-screen overlay with backdrop blur
- Shows: tier emoji (64px, scale-in animation) → tier name (32px Outfit 800, fade-in) → subtitle ("You reached Expert tier · Elo 950+") → Share button
- Confetti particles in tier colors (30 particles, randomized positions, fall animation 1.5-3s)
- Auto-dismisses after 4 seconds, also dismissable by tap

Animation timeline:
- 0.0s: overlay fades in (opacity 0→1, 0.5s)
- 0.1s: badge emoji scales in (scale 0→1, 0.8s cubic-bezier bounce)
- 0.3s: tier name scales in (scale 0.7→1, 0.6s cubic-bezier bounce)
- 0.5s: confetti starts falling
- 0.6s: subtitle fades in
- 0.8s: Share button fades in
- 4.0s: everything fades out
```

**Integration:** Import into `MobileShell.jsx` and `App.jsx`. Compare tier before/after Elo update.

### 8.4 Skeleton Loaders

**Reference:** Visual Guide section 04

**Create new component:** `src/components/Skeleton.jsx`

```jsx
// Reusable skeleton primitives
export function SkeletonLine({ width = '100%', height = 14 }) { ... }
export function SkeletonCircle({ size = 28 }) { ... }
export function SkeletonCard() { ... }

// Page-specific skeletons
export function RankingSkeleton() { /* 4-5 rows matching Rankings table layout */ }
export function ProfileSkeleton() { /* Tier badge + name + stat boxes + sparkline placeholder */ }
export function ActivitySkeleton() { /* 3-4 activity card placeholders */ }
```

Animation: `background: linear-gradient(90deg, #e8ecf0 25%, #f3f5f7 50%, #e8ecf0 75%)`, `background-size: 200% 100%`, `animation: skeleton-pulse 1.5s ease-in-out infinite`

**Integration:** Show skeletons in Rankings, ProfileSection, and ActivityFeed while `loading` state is true.

### 8.5 Auth Consent Checkbox

**File:** `src/components/Auth.jsx` (145 lines)

Add a required checkbox before the submit button on the signup form:

```jsx
<label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 20 }}>
  <input type="checkbox" required style={{ marginTop: 3 }} />
  <span style={{ fontSize: 12, color: C.slate, lineHeight: 1.5 }}>
    I agree to the <span onClick={() => setTab('terms')} style={{ color: C.jade, fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span> and <span onClick={() => setTab('privacy')} style={{ color: C.jade, fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
  </span>
</label>
```

### 8.6 ProfileSetup Bug Fix

**File:** `src/components/ProfileSetup.jsx` (65 lines)

**Bug:** The complete-profile screen asks for full name, which overwrites the display name set during signup.

**Fix:** Either:
- Remove the name field entirely (just ask for town + club)
- OR pre-populate with the existing `player.name` and make it read-only with an edit link

### 8.7 Image Optimization

**File:** `public/bg-floral.jpg` (11MB)

This file is 11MB. Either:
- Compress to WebP at 80% quality (should reduce to ~200-500KB)
- Remove entirely if not used in the current design
- Check if it's referenced anywhere: `grep -r "bg-floral" src/`

### 8.8 Landing Page: Promote Elo Calculator

**File:** `src/components/Homepage.jsx`

The interactive Elo calculator already exists in `HowItWorks.jsx`. Extract it into a standalone component and add it to the landing page as a "Try It" section between the tier showcase and the leaderboard preview.

```
Section label: "TRY IT" (gold, on midnight background)
Title: "See how Elo works"
Three sliders: Your Elo, Opponent Elo, Games Played
Two result cards: "If you WIN" (jade) and "If you LOSE" (crimson)
K-factor and gap adjustment display below
```

See Visual Guide section 06 for the exact layout.

---

## 9. Bug Fixes

### 9.1 Tier Threshold Discrepancy

**File:** `src/eloUtils.js` line 19-26

Current code uses thresholds: 750/850/950/1050/1150
Elo spec v2.0 document says: 700/800/900/1000/1100

**Decision needed from Dan:** Which thresholds to use. The code thresholds (v2.1) are wider and probably better for a small player pool. If keeping v2.1, update the spec document. If reverting to v2.0, update `eloUtils.js`.

### 9.2 Supabase Site URL

Add `https://` prefix to the Supabase project Site URL in the Supabase dashboard (Settings → General → Site URL).

---

## 10. Implementation Checklist

Complete in order. Each section is independently committable.

```
[ ] 1. Standardize C token set across all 22 components (add jadePale, crimsonPale, goldPale)
[ ] 2. Homepage hero: status pill, gradient text, grid texture
[ ] 3. Homepage features: 2x2 grid, pale icon containers
[ ] 4. Homepage NEW: tier showcase section
[ ] 5. Homepage: promote Elo calculator to landing page
[ ] 6. Header: optional text-based logo
[ ] 7. MobileShell: floating record button, active tab styling
[ ] 8. Rankings: Season/All-Time toggle, card wrapper, column headers, #1 highlight, tier tags
[ ] 9. ProfileSection: dark Elo card, badge styling (gold-pale earned, grayed locked)
[ ] 10. RecordMatch: player avatar cards, winner state, wall game card, badge hint
[ ] 11. ActivityFeed: color-coded accent borders by type, layout refinement
[ ] 12. NEW: BadgeToast.jsx component + integration
[ ] 13. NEW: Rating change count-up animation
[ ] 14. NEW: TierPromotion.jsx celebration overlay + integration
[ ] 15. NEW: Skeleton.jsx loaders + integration into Rankings, Profile, Activity
[ ] 16. Auth.jsx: consent checkbox
[ ] 17. ProfileSetup.jsx: display name bug fix
[ ] 18. Image optimization: bg-floral.jpg
[ ] 19. Tier threshold decision + reconciliation
[ ] 20. Supabase Site URL fix
```

---

## Commit Message Convention

```
style: [component] description          — for visual changes
feat: [component] description           — for new functionality
fix: [component] description            — for bug fixes
perf: optimize image assets             — for performance
```

Examples:
```
style: Homepage hero gradient text and status pill
style: Rankings card wrapper and tier tags
feat: BadgeToast celebration component
feat: TierPromotion overlay with confetti
feat: Skeleton loaders for data views
fix: ProfileSetup display name overwrite bug
fix: Auth add consent checkbox
perf: compress bg-floral.jpg
```

---

*This brief was generated from the MahjRank Design Research Report v2.0, the Full Site Redesign Prototype, and the Design Recommendations Visual Guide. All three documents are available in this project for reference.*
