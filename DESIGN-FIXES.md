# MahjRank Design Fixes — Claude Code Instructions

Run these tasks in Claude Code from the project root (`monmouth-made-mahjong/`).
Each section is a standalone prompt you can paste into Claude Code.

---

## 1. Migrate All Components to Shared Theme

A `src/theme.js` file has already been created with the canonical color tokens,
font definitions, shadow presets, and reusable `accentCard`/`accentLink` helpers.

### Claude Code prompt:

```
In every file under src/components/ that defines a local `const C = { ... }` object
with color values, do the following:

1. Remove the local `const C = { ... }` definition
2. Add `import { C } from '../theme'` at the top (adjust path depth if needed)
3. If the file also defines `accentCard` or `accentLink` helper functions,
   remove those too and import them from '../theme' instead
4. If the file references `C.cloudLt`, replace it with `C.white`
5. If the file's local `C.cloud` was '#EDF0F4' (not '#F8FAFC'), replace those
   usages with `C.cloudDk` from the theme
6. Do NOT change any component logic, props, or structure — only the color imports

The shared theme file is at src/theme.js. Read it first to understand the exports.

Files that need this migration (check each one):
- src/components/Homepage.jsx
- src/components/MobileShell.jsx
- src/components/Header.jsx
- src/components/Rankings.jsx
- src/components/RecordMatch.jsx
- src/components/Auth.jsx
- src/components/Clubs.jsx
- src/components/ProfileSection.jsx
- src/components/ActivityFeed.jsx
- src/components/Players.jsx
- src/components/NotificationBell.jsx
- src/components/HowItWorks.jsx

After making changes, run `npm run build` to verify nothing breaks.
```

---

## 2. Fix Accessibility Contrast Issues

### Claude Code prompt:

```
Fix WCAG AA contrast failures across the MahjRank codebase. The theme file
at src/theme.js now has `C.slateMd` (#6B7280) as an accessible alternative
to `C.slateLt` (#94A3B8).

Rules:
- Any text using `C.slateLt` or `#94A3B8` that is SMALLER than 18px
  must be changed to `C.slateMd` or `C.slate`
- `C.slateLt` is still OK for decorative elements, large text (18px+),
  or borders
- In Homepage.jsx, the hero section body text uses
  `color: 'rgba(255,255,255,0.4)'` — change this to
  `color: 'rgba(255,255,255,0.55)'` for a 4.5+ contrast ratio on #0F172A
- In Homepage.jsx footer, links use `color: 'rgba(255,255,255,0.4)'` —
  change to `color: 'rgba(255,255,255,0.55)'`
- The "INACTIVE" label in Rankings.jsx uses C.slateLt at 9px — change to
  C.slateMd
- Provisional players' Elo rating "?" uses C.slateLt — change to C.slateMd
- Any sublabel text (fontSize 9-11px) using C.slateLt should use C.slateMd

Do NOT change any font sizes, layouts, or component structure.
Run `npm run build` after to verify.
```

---

## 3. Fix Hero CTA Button Destinations

### Claude Code prompt:

```
In src/components/Homepage.jsx, the hero section has two buttons:
"Get Started — Free" and "Sign In". Both currently call `setTab('players')`.

Fix them:
1. "Get Started — Free" should remain `onClick={() => setTab('players')}`
   (this triggers the auth/signup flow)
2. "Sign In" should change to `onClick={() => setTab('login')}`
   to go directly to the login form

Also fix the bottom CTA section's "Create Your Free Account" button —
it should stay as `setTab('players')` (signup flow). This is already correct.

In src/components/MobileShell.jsx, the Homepage is rendered with a custom
setTab mapper. Verify that when the Homepage calls setTab('login'), the
MobileShell correctly routes to the login tab. The current mapper converts
'players' to 'login' — add a direct mapping for 'login' as well:
  else if (t === 'login') setTab('login')
```

---

## 4. Add Desktop Profile Tab

### Claude Code prompt:

```
Desktop users currently have no way to access their profile page (badges,
sparkline, rivals, follow suggestions). Fix this:

1. In src/components/Header.jsx:
   - Add 'profile' to the `tabs` array for authenticated users, placing it
     last (after 'record')
   - Add the label mapping: `profile: 'Profile'`
   - Style it like the other nav tabs (not like the Record button)

2. In src/App.jsx:
   - Import ProfileSection: `import ProfileSection from './components/ProfileSection'`
   - Add a route in the main render:
     `{tab === 'profile' && session && <ProfileSection session={session}
       player={player} onSignOut={handleSignOut} setTab={setTab}
       onPlayerClick={(id) => { setSelectedPlayerId(id); setTab('players') }} />}`
   - Place it alongside the other tab renders in the <main> section

Make sure ProfileSection receives all the same props it gets in MobileShell.
Run `npm run build` after to verify.
```

---

## 5. Fix Non-Semantic Interactive Elements

### Claude Code prompt:

```
Search all files in src/components/ for <span> or <div> elements that have
onClick handlers but are not buttons or links. Convert them to proper
semantic elements:

1. Any `<span onClick={...}>` that acts as a link/button should become
   `<button>` with `style={{ background: 'none', border: 'none', ... }}`
   keeping the existing styles

2. In Auth.jsx specifically, look for:
   - "Forgot password?" — should be a <button> not a <span>
   - "Sign up" / "Sign in" toggle text — should be <button> elements
   - Add `type="button"` to prevent form submission

3. In Homepage.jsx footer, the navigation links are already <button> ✓

4. Add `tabIndex={0}` and `onKeyDown` (Enter/Space triggers click) to any
   remaining interactive divs that can't easily be converted to buttons

5. In Rankings.jsx, the PlayerCard div with onClick should get
   `role="button"` and `tabIndex={0}` with keyboard handler

Do NOT change visual appearance — only the underlying HTML semantics.
Run `npm run build` after to verify.
```

---

## 6. Unify Duplicate TierBadge Component

### Claude Code prompt:

```
The TierBadge component is defined independently in both MobileShell.jsx
and ProfileSection.jsx with slightly different implementations.

1. Create a new file: src/components/TierBadge.jsx
2. Move the TierBadge component there. Use the ProfileSection version as
   the base (it uses getTier() from eloUtils which is cleaner)
3. Include the tier badge image imports (novice through grandmaster)
4. Export it as the default export
5. In MobileShell.jsx: remove the local TierBadge, TIER_IMAGES, and badge
   imports. Add `import TierBadge from './TierBadge'`
6. In ProfileSection.jsx: remove the local TierBadge, TIER_IMAGES, and
   badge imports. Add `import TierBadge from './TierBadge'`
7. Make sure both usages still work (check props — both pass `elo`)

Run `npm run build` after to verify.
```

---

## Run Order

Execute these in order (each depends on the previous):

1. **Theme migration** (biggest change, touches all files)
2. **Contrast fixes** (uses new theme tokens)
3. **Hero CTA fix** (small, isolated)
4. **Desktop Profile tab** (small, isolated)
5. **Semantic HTML fixes** (touches several files)
6. **TierBadge unification** (small refactor)

After all 6, run a final `npm run build` and test both desktop and mobile views.

---

## Verification Checklist

- [ ] `npm run build` completes with no errors
- [ ] No local `const C = {` definitions remain in components (only in theme.js)
- [ ] Hero "Sign In" button goes to login, "Get Started" goes to signup
- [ ] Desktop header shows Profile tab when logged in
- [ ] All small text (< 14px) uses #6B7280 or darker, not #94A3B8
- [ ] Tab key navigates through all interactive elements with visible focus ring
- [ ] TierBadge imported from single shared component in both mobile and profile
