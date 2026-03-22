import { useState } from 'react'
import { supabase } from '../supabase'
import { getKFactor, getTier, TIERS } from '../eloUtils'

const C = {
  jade: '#065F46', jadeLt: '#059669', crimson: '#DC2626', gold: '#F59E0B', goldDk: '#D97706',
  midnight: '#0F172A', ink: '#1E293B', cloud: '#F8FAFC', slate: '#64748B', slateLt: '#94A3B8', border: '#E2E8F0',
}

function RankBadge({ name, bg, textColor, range }) {
  return <div style={{ background: bg, borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}><div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: textColor, marginBottom: 2 }}>{name}</div><div style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: textColor, opacity: 0.8 }}>{range}</div></div>
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={() => setOpen(!open)} style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, color: C.midnight }}>{q}<span style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', fontSize: 10 }}>▾</span></div>
      {open && <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginTop: 8 }}>{a}</div>}
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [topic, setTopic] = useState(''); const [message, setMessage] = useState(''); const [sent, setSent] = useState(false)
  async function handleSubmit(e) { e.preventDefault(); await supabase.from('notifications').insert({ type: 'contact', message: `From: ${name} (${email}) | Topic: ${topic} | Message: ${message}` }); setSent(true) }
  if (sent) return <div style={{ background: 'rgba(6,95,70,0.06)', border: `1px solid rgba(6,95,70,0.15)`, borderLeft: `4px solid ${C.jade}`, borderRadius: 8, padding: '14px 16px', fontSize: 13, color: C.jade, fontFamily: "'DM Sans', sans-serif" }}>Message sent — we'll be in touch within 48 hours.</div>
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Your name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required /></div>
      <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" required /></div>
      <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Topic</label><select value={topic} onChange={e => setTopic(e.target.value)} required><option value="">Select a topic...</option><option>General question</option><option>Starting a new club</option><option>Match dispute</option><option>Account issue</option><option>Report a violation</option><option>Other</option></select></div>
      <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 4 }}>Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's on your mind..." required style={{ height: 90, resize: 'vertical' }} /></div>
      <button type="submit" style={{ width: '100%', background: C.crimson, color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}>Send Message</button>
    </form>
  )
}

export default function HowItWorks() {
  const [tab, setTab] = useState('start')
  const [myElo, setMyElo] = useState(800); const [oppElo, setOppElo] = useState(800); const [myGames, setMyGames] = useState(0)
  const D = 40; const k = getKFactor(myGames); const gapAdj = (oppElo - myElo) / D
  const winGain = Math.round(k * (30 + gapAdj) * 10) / 10; const lossLoss = Math.round(Math.abs(k * (-10 + gapAdj)) * 10) / 10
  const gap = oppElo - myElo
  let ctx = 'Evenly matched'
  if (gap > 150) ctx = 'You are the underdog — big upside if you win'
  else if (gap > 75) ctx = 'Opponent is stronger — good chance to gain big'
  else if (gap < -150) ctx = 'You are the heavy favorite — less to gain'
  else if (gap < -75) ctx = 'You are favored — moderate gain if you win'

  const tabs = ['start', 'elo', 'nmjl', 'conduct', 'hof', 'contact']
  const tabLabels = { start: 'Get Started', elo: 'Elo & Ranks', nmjl: 'Mahjong Guide', conduct: 'Code of Conduct', hof: 'Hall of Fame', contact: 'Contact' }

  return (
    <div>
      <div style={{ marginBottom: 16 }}><h2 style={{ fontSize: 18, fontWeight: 700, color: C.midnight }}>Member Guide</h2><p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Everything you need to know about MahjRank</p></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map(t => (<button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', background: tab === t ? C.midnight : 'white', color: tab === t ? C.cloud : C.slate, border: tab === t ? 'none' : `1px solid ${C.border}` }}>{tabLabels[t]}</button>))}
      </div>

      {tab === 'start' && (
        <div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {[
              { n: 1, title: 'Create your account', desc: 'Sign up with email or Google. Verify your email to activate your account.', accent: C.jade },
              { n: 2, title: 'Set up your profile', desc: 'Add your name and town (optional). Your starting Elo is 800.', accent: C.jadeLt },
              { n: 3, title: 'Join a club', desc: "Browse the Clubs tab to find a group. Click into a club and hit Request to Join — the organizer will approve you.", accent: C.gold },
              { n: 4, title: 'Play and record your first game', desc: 'After your game, go to the Record tab and submit the result. Select all players, pick the winner, and submit.', accent: C.crimson },
            ].map(s => (
              <div key={s.n} style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `4px solid ${s.accent}`, borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{s.n}</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, marginBottom: 3 }}>{s.title}</div><div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{s.desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(6,95,70,0.04)', border: `1px solid rgba(6,95,70,0.12)`, borderLeft: `4px solid ${C.jade}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, marginBottom: 10 }}>How game verification works</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { step: '1', label: 'Any player submits the result', desc: 'Go to the Record tab, select all players at the table, pick the winner or mark as wall game.' },
                { step: '2', label: 'Other players get notified', desc: 'All other players at the table receive a notification to confirm or dispute.' },
                { step: '3', label: '1 player confirms', desc: 'Just one other player needs to confirm the result for Elo to update.' },
                { step: '4', label: 'Elo updates automatically', desc: 'Once confirmed, ratings update instantly using the Tenhou-based formula.' },
                { step: '!', label: 'Auto-verified after 48 hours', desc: "If nobody disputes within 48 hours, the result is automatically accepted." },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: s.step === '!' ? C.crimson : C.midnight, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{s.step}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.midnight }}>{s.label}</div><div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { q: 'Is MahjRank free?', a: 'Yes — completely free. No membership fees or registration costs.' },
              { q: 'Do I need to be an experienced player?', a: 'Not at all. All skill levels welcome. New players start at 800 Elo in the Beginner tier.' },
              { q: 'Can I play in more than one club?', a: 'Yes — your Elo is tied to your account, not your club. All results count toward the same rating.' },
              { q: 'How many confirmations does a game need?', a: 'Just 1 other player at the table needs to confirm. If nobody disputes within 48 hours, the result is auto-verified.' },
              { q: 'What if a game result is wrong?', a: 'Hit the Dispute button instead of Confirm. The game gets flagged and the admin reviews it.' },
              { q: 'What is a wall game?', a: 'When the wall runs out of tiles and nobody wins. Wall games count toward your games played but no ratings change.' },
              { q: 'When do I appear on the leaderboard?', a: 'After 5 verified games. Until then you\'re listed as "Provisional" with a ? next to your rating.' },
            ].map(f => <Faq key={f.q} {...f} />)}
          </div>
        </div>
      )}

      {tab === 'elo' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 10 }}>Rank tiers</h3>
            <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>All players start at 800 Elo — in the Beginner tier. Rating floor is 500.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>{TIERS.map(t => <RankBadge key={t.name} name={t.name} bg={t.bg} textColor={t.textColor} range={t.max === 99999 ? `${t.min}+` : `${t.min}–${t.max}`} />)}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>How the Elo formula works</h3>
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.jade}`, borderRadius: 10, padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.slate, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 10 }}>Our system is based on <strong style={{ color: C.midnight }}>Tenhou.net's battle-tested 4-player Elo</strong>, adapted for American Mahjong.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: C.midnight }}>Rating Change = K × (Placement Base + Rating Gap Adjustment)</strong></p>
              <p style={{ marginBottom: 10 }}>The winner gets <strong>+30</strong>. Each loser gets <strong>-10</strong>. Zero-sum: +30 - 10 - 10 - 10 = 0.</p>
              <p style={{ marginBottom: 10 }}>The <strong>rating gap adjustment</strong> compares the average opponent rating to yours, divided by 40.</p>
              <p style={{ marginBottom: 0 }}>The <strong>K-factor</strong> starts high (~1.0) and decays to 0.2 after 120 rated games.</p>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>K-Factor decay</h3>
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                <thead><tr style={{ background: C.midnight }}>{['Rated Games', 'K-Factor', 'Max Win', 'Max Loss'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[{ g: '1', k: '1.00', w: '+30.0', l: '-10.0' }, { g: '10', k: '0.93', w: '+27.9', l: '-9.3' }, { g: '20', k: '0.87', w: '+26.0', l: '-8.7' }, { g: '40', k: '0.73', w: '+22.0', l: '-7.3' }, { g: '80', k: '0.47', w: '+14.0', l: '-4.7' }, { g: '120+', k: '0.20', w: '+6.0', l: '-2.0' }].map((r, i) => (
                    <tr key={r.g} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.cloud : 'white' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{r.g}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: C.midnight, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{r.k}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: C.jade }}>{r.w}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: C.crimson }}>{r.l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>Elo calculator</h3>
            <p style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Drag the sliders to see how your rating would change.</p>
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div><div style={{ fontSize: 11, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Your Elo</div><div style={{ fontSize: 20, fontWeight: 700, color: C.midnight, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{myElo}</div><input type="range" min="500" max="1400" value={myElo} onChange={e => setMyElo(parseInt(e.target.value))} style={{ width: '100%' }} /></div>
                <div><div style={{ fontSize: 11, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Avg Opponent Elo</div><div style={{ fontSize: 20, fontWeight: 700, color: C.midnight, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{oppElo}</div><input type="range" min="500" max="1400" value={oppElo} onChange={e => setOppElo(parseInt(e.target.value))} style={{ width: '100%' }} /></div>
                <div><div style={{ fontSize: 11, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Rated Games</div><div style={{ fontSize: 20, fontWeight: 700, color: C.midnight, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{myGames} <span style={{ fontSize: 11, fontWeight: 400, color: C.slateLt }}>K={k.toFixed(2)}</span></div><input type="range" min="0" max="150" value={myGames} onChange={e => setMyGames(parseInt(e.target.value))} style={{ width: '100%' }} /></div>
              </div>
              <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>{ctx}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(6,95,70,0.06)', borderRadius: 10, padding: 12, textAlign: 'center', border: `1px solid rgba(6,95,70,0.12)` }}><div style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: C.jade, marginBottom: 3 }}>If you WIN</div><div style={{ fontSize: 22, fontWeight: 700, color: C.jade, fontFamily: "'JetBrains Mono', monospace" }}>+{winGain}</div></div>
                <div style={{ background: 'rgba(220,38,38,0.04)', borderRadius: 10, padding: 12, textAlign: 'center', border: `1px solid rgba(220,38,38,0.1)` }}><div style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: C.crimson, marginBottom: 3 }}>If you LOSE</div><div style={{ fontSize: 22, fontWeight: 700, color: C.crimson, fontFamily: "'JetBrains Mono', monospace" }}>−{lossLoss}</div></div>
                <div style={{ background: C.cloud, borderRadius: 10, padding: 12, textAlign: 'center', border: `1px solid ${C.border}` }}><div style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: C.slate, marginBottom: 3 }}>WALL GAME</div><div style={{ fontSize: 22, fontWeight: 700, color: C.slate, fontFamily: "'JetBrains Mono', monospace" }}>0</div></div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}><h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>Wall games</h3><div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.slate, lineHeight: 1.7 }}>When a game ends with no winner, <strong style={{ color: C.midnight }}>no ratings change</strong>. Wall games still count toward games played but do not affect your K-factor.</div></div>
          <div style={{ marginBottom: 20 }}><h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>Provisional period</h3><div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.slate, lineHeight: 1.7 }}>Players appear on the leaderboard after <strong style={{ color: C.midnight }}>5 verified rated games</strong>. Before that, your rating shows with a "?" and you're listed in the Provisional section.</div></div>
          <div><h3 style={{ fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>Season calendar</h3><div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.slate, lineHeight: 1.7 }}>Seasons run <strong style={{ color: C.midnight }}>May 1 – April 30</strong> (aligned with the NMJL card year). At the start of each new season, ratings undergo a <strong style={{ color: C.midnight }}>soft reset</strong>: New Rating = 800 + 0.6 × (Old Rating - 800). Your first 10 games get a K-factor boost for faster recovery. All-time career stats are preserved permanently. No rating decay for inactivity.</div></div>
        </div>
      )}

      {tab === 'nmjl' && (
        <div>
          <p style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: 16 }}>American Mahjong follows rules set by the National Mah Jongg League (NMJL), founded in 1937.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { title: 'The Card', desc: 'Each year NMJL publishes a new card listing the only winning hands allowed.' },
              { title: '4 Players', desc: 'Always played with exactly 4 players. Each starts with 13 tiles.' },
              { title: 'Jokers', desc: 'American Mahjong uses 8 joker tiles. Jokers substitute for any tile in a set of 3 or more.' },
              { title: 'Calling tiles', desc: 'You can call any discarded tile to complete your hand.' },
              { title: 'Scoring', desc: 'MahjRank tracks wins and Elo ratings. Point scoring stays between players.' },
              { title: 'Where to learn', desc: 'Best free resource: mahjonged.com. NMJL: nationalmahjonggleague.org.' },
            ].map(c => <div key={c.title} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, marginBottom: 4 }}>{c.title}</div><div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{c.desc}</div></div>)}
          </div>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {[{ q: 'vs Chinese Mahjong', a: 'Chinese mahjong has no jokers and no annual card. American Mahjong is more structured.' }, { q: 'vs Japanese Riichi', a: 'Riichi has complex point scoring. American Mahjong is simpler to score but requires memorizing the annual card.' }, { q: "I've never played — how long to learn?", a: 'Most new players can play a full game within 2–3 sessions. All clubs welcome beginners.' }].map(f => <Faq key={f.q} {...f} />)}
          </div>
        </div>
      )}

      {tab === 'conduct' && (
        <div>
          <p style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: 16 }}>MahjRank is built on friendly competition and mutual respect.</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {[
              { title: 'Confirm results honestly', desc: 'Verify results accurately. Confirming a false result is grounds for suspension.', accent: C.jade },
              { title: 'Always dispute — never ignore', desc: 'If a result is wrong, hit Dispute immediately. Games auto-accept after 48 hours.', accent: C.jade },
              { title: 'Respect all players', desc: 'Treat every player with courtesy regardless of skill level.', accent: C.jade },
              { title: 'Play by the rules', desc: 'Follow standard NMJL rules. Disputes should be resolved calmly.', accent: C.jade },
              { title: 'Record games promptly', desc: 'Submit results within 24 hours of playing.', accent: C.jade },
              { title: 'Violations & disputes', desc: 'Report suspected violations via the Contact tab. Admin reviews all reports.', accent: C.crimson },
            ].map(c => (
              <div key={c.title} style={{ background: 'white', borderLeft: `4px solid ${c.accent}`, padding: '12px 14px', borderRadius: '0 10px 10px 0', border: `1px solid ${C.border}`, borderLeftWidth: 4, borderLeftColor: c.accent }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.cloud, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', fontSize: 12, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            <strong style={{ color: C.midnight }}>Verification policy:</strong> 1 other player must confirm before Elo updates. All results auto-accept after 48 hours if not disputed.
          </div>
        </div>
      )}

      {tab === 'hof' && (
        <div>
          <p style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: 16 }}>Champions and season award winners are immortalized here.</p>
          <div style={{ background: 'white', border: `1px dashed ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 20 }}><div style={{ fontSize: 14, color: C.slate, fontFamily: "'DM Sans', sans-serif" }}>Season 1 is underway — check back April 30, 2026 for the first Hall of Fame inductees.</div></div>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.midnight, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>Season end awards</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ title: 'Season Champion', desc: '#1 Elo at season close' }, { title: 'Most Improved', desc: 'Biggest Elo gain' }, { title: 'Most Active', desc: 'Most games played' }, { title: 'Club Champion', desc: 'Top player per club' }].map(a => (
                <div key={a.title} style={{ background: C.cloud, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.midnight }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: C.slateLt, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 13, color: C.slate, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: 16 }}>Have a question, want to start a new club, or need to report an issue?</p>
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}><ContactForm /></div>
        </div>
      )}
    </div>
  )
}
