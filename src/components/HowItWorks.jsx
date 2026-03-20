import { useState } from 'react'
import { supabase } from '../supabase'
import { getKFactor, getTier, TIERS } from '../eloUtils'

function RankBadge({ name, bg, textColor, range }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'sans-serif', color: textColor, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 10, fontFamily: 'sans-serif', color: textColor, opacity: 0.8 }}>{range}</div>
    </div>
  )
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={() => setOpen(!open)} style={{ padding: '14px 16px', borderBottom: '0.5px solid #e8e8e4', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#1e2b65' }}>
        {q}
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', fontSize: 10 }}>▾</span>
      </div>
      {open && <div style={{ fontSize: 12, color: '#555', fontFamily: 'sans-serif', lineHeight: 1.6, marginTop: 8 }}>{a}</div>}
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('notifications').insert({
      type: 'contact',
      message: `From: ${name} (${email}) | Topic: ${topic} | Message: ${message}`
    })
    setSent(true)
  }

  if (sent) return (
    <div style={{ background: '#d1fae5', border: '0.5px solid #6ee7b7', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#065f46', fontFamily: 'sans-serif' }}>
      Message sent — we'll be in touch within 48 hours.
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" required />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Topic</label>
        <select value={topic} onChange={e => setTopic(e.target.value)} required>
          <option value="">Select a topic...</option>
          <option>General question</option>
          <option>Starting a new club</option>
          <option>Match dispute</option>
          <option>Account issue</option>
          <option>Report a violation</option>
          <option>Other</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', display: 'block', marginBottom: 4 }}>Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's on your mind..." required style={{ height: 90, resize: 'vertical' }} />
      </div>
      <button type="submit" style={{ width: '100%', background: '#1e2b65', color: '#f4f4f2', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer' }}>
        Send Message
      </button>
    </form>
  )
}

export default function HowItWorks() {
  const [tab, setTab] = useState('start')
  const [myElo, setMyElo] = useState(800)
  const [oppElo, setOppElo] = useState(800)
  const [myGames, setMyGames] = useState(0)

  // Tenhou formula from spec
  const D = 40
  const k = getKFactor(myGames)
  const gapAdj = (oppElo - myElo) / D
  const winGain = Math.round(k * (30 + gapAdj) * 10) / 10
  const lossLoss = Math.round(Math.abs(k * (-10 + gapAdj)) * 10) / 10
  const gap = oppElo - myElo
  let ctx = 'Evenly matched'
  if (gap > 150) ctx = 'You are the underdog — big upside if you win'
  else if (gap > 75) ctx = 'Opponent is stronger — good chance to gain big'
  else if (gap < -150) ctx = 'You are the heavy favorite — less to gain'
  else if (gap < -75) ctx = 'You are favored — moderate gain if you win'

  const tabs = ['start', 'elo', 'nmjl', 'conduct', 'hof', 'contact']
  const tabLabels = { start: 'Get Started', elo: 'Elo & Ranks', nmjl: 'NMJL Guide', conduct: 'Code of Conduct', hof: 'Hall of Fame', contact: 'Contact' }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2b65' }}>Member Guide</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Everything you need to know about Monmouth Made Mah Jongg</p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12,
            fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer',
            background: tab === t ? '#1e2b65' : 'white',
            color: tab === t ? '#f4f4f2' : '#555',
            border: tab === t ? 'none' : '0.5px solid #c8cdd6'
          }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === 'start' && (
        <div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {[
              { n: 1, title: 'Create your account', desc: 'Sign up with email or Google. Verify your email to activate your account.' },
              { n: 2, title: 'Set your town', desc: "Tell us which Monmouth County town you represent. Admin will verify — your town can't be changed after verification." },
              { n: 3, title: 'Join a club', desc: "Browse the Clubs tab to find a group near you. Click into a club and hit Request to Join — the organizer will approve you. No club nearby? Contact us and we'll help you start one." },
              { n: 4, title: 'Play and record your first game', desc: 'After your game, go to the Record tab and submit the result. Select all players at the table, pick the winner (or mark it as a wall game), and submit. One other player must confirm before Elo updates.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e2b65', color: '#f4f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Match confirmation explainer */}
          <div style={{ background: '#eef1f8', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginBottom: 10 }}>How game verification works</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { step: '1', label: 'Any player submits the result', desc: 'Go to the Record tab, select all players at the table, pick the winner or mark as wall game.' },
                { step: '2', label: 'Other players get notified', desc: 'All other players at the table receive a notification to confirm or dispute.' },
                { step: '3', label: '1 player confirms', desc: 'Just one other player needs to confirm the result for Elo to update.' },
                { step: '4', label: 'Elo updates automatically', desc: 'Once confirmed, ratings update instantly using the Tenhou-based formula.' },
                { step: '!', label: 'Auto-verified after 48 hours', desc: "If nobody disputes within 48 hours, the result is automatically accepted." },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.step === '!' ? '#9f1239' : '#1e2b65', color: s.step === '!' ? 'white' : '#f4f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: 'sans-serif' }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e2b65', fontFamily: 'sans-serif' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
            {[
              { q: 'Is this league free to join?', a: 'Yes — completely free. No membership fees or registration costs.' },
              { q: 'Do I need to be an experienced player?', a: 'Not at all. All skill levels welcome. New players start at 800 Elo in the Skilled tier.' },
              { q: 'Can I play in more than one club?', a: 'Yes — your Elo is tied to your account, not your club. All results count toward the same rating.' },
              { q: 'What if my town has no players yet?', a: "That means you'd be the first — a great opportunity to put your town on the map." },
              { q: 'How many confirmations does a game need?', a: 'Just 1 other player at the table needs to confirm. If nobody disputes within 48 hours, the result is auto-verified.' },
              { q: 'What if a game result is wrong?', a: 'Hit the Dispute button instead of Confirm. The game gets flagged and the league admin reviews it. Never just ignore a wrong result — always dispute it.' },
              { q: 'What is a wall game?', a: 'When the wall runs out of tiles and nobody wins. Wall games count toward your games played (affecting your K-factor) but no ratings change.' },
              { q: 'When do I appear on the leaderboard?', a: 'After 5 verified games. Until then you\'re listed as "Provisional" with a ? next to your rating.' },
            ].map(f => <Faq key={f.q} {...f} />)}
          </div>
        </div>
      )}

      {tab === 'elo' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 10 }}>Rank tiers</h3>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', marginBottom: 12 }}>All players start at 800 Elo — in the Skilled tier. Rating floor is 500 (you can never drop below).</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
              {TIERS.map(t => (
                <RankBadge key={t.name} name={t.name} bg={t.bg} textColor={t.textColor}
                  range={t.max === 99999 ? `${t.min}+` : `${t.min}–${t.max}`} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 8 }}>How the Elo formula works</h3>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, fontFamily: 'sans-serif', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 10 }}>Our system is based on <strong style={{ color: '#1e2b65' }}>Tenhou.net's battle-tested 4-player Elo</strong>, adapted for American Mah Jongg.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#1e2b65' }}>Rating Change = K × (Placement Base + Rating Gap Adjustment)</strong></p>
              <p style={{ marginBottom: 10 }}>The winner gets a placement base of <strong>+30</strong>. Each loser gets <strong>-10</strong>. This is zero-sum: +30 - 10 - 10 - 10 = 0.</p>
              <p style={{ marginBottom: 10 }}>The <strong>rating gap adjustment</strong> compares the average opponent rating to yours, divided by 40. Beat stronger opponents, earn more. Lose to weaker ones, lose more.</p>
              <p style={{ marginBottom: 0 }}>The <strong>K-factor</strong> starts high (~1.0) so new players find their level fast, then decays to 0.2 after 80 games for stability.</p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 8 }}>K-Factor decay</h3>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'sans-serif' }}>
                <thead>
                  <tr style={{ background: '#1e2b65' }}>
                    {['Games Played', 'K-Factor', 'Max Win Gain', 'Max Loss'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#ffffff', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { games: '1', k: '1.00', win: '+30.0', loss: '-10.0' },
                    { games: '10', k: '0.90', win: '+27.0', loss: '-9.0' },
                    { games: '20', k: '0.80', win: '+24.0', loss: '-8.0' },
                    { games: '40', k: '0.60', win: '+18.0', loss: '-6.0' },
                    { games: '60', k: '0.40', win: '+12.0', loss: '-4.0' },
                    { games: '80+', k: '0.20', win: '+6.0', loss: '-2.0' },
                  ].map((r, i) => (
                    <tr key={r.games} style={{ borderBottom: '0.5px solid #e8e8e4', background: i % 2 ? '#f9f9f7' : 'white' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{r.games}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#1e2b65', fontWeight: 700 }}>{r.k}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#16a34a' }}>{r.win}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#dc2626' }}>{r.loss}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 8 }}>Elo calculator</h3>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', marginBottom: 12 }}>Drag the sliders to see exactly how your rating would change.</p>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 2 }}>Your Elo</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65', marginBottom: 4 }}>{myElo}</div>
                  <input type="range" min="500" max="1400" value={myElo} onChange={e => setMyElo(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 2 }}>Avg Opponent Elo</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65', marginBottom: 4 }}>{oppElo}</div>
                  <input type="range" min="500" max="1400" value={oppElo} onChange={e => setOppElo(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 2 }}>Your Games Played</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2b65', marginBottom: 4 }}>{myGames} <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>K={k.toFixed(2)}</span></div>
                  <input type="range" min="0" max="100" value={myGames} onChange={e => setMyGames(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 12 }}>{ctx}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ background: '#d1fae5', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, color: '#065f46', marginBottom: 3 }}>If you WIN</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#065f46' }}>+{winGain}</div>
                </div>
                <div style={{ background: '#fee2e2', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, color: '#991b1b', marginBottom: 3 }}>If you LOSE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#991b1b' }}>−{lossLoss}</div>
                </div>
                <div style={{ background: '#f4f4f2', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, color: '#555', marginBottom: 3 }}>WALL GAME</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#555' }}>0</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 8 }}>Wall games</h3>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, fontFamily: 'sans-serif', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              When a game ends with no winner, <strong style={{ color: '#1e2b65' }}>no ratings change</strong>. Wall games still count toward your games played (which affects your K-factor decay). This keeps it simple: win = go up, lose = go down, nobody wins = nothing changes.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 8 }}>Provisional period</h3>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, fontFamily: 'sans-serif', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              Players appear on the leaderboard after <strong style={{ color: '#1e2b65' }}>5 verified games</strong>. Before that, your rating shows with a "?" (e.g., "823?") and you're listed in the Provisional section. This prevents a player with 1 lucky win from sitting at #1.
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e2b65', marginBottom: 8 }}>Season calendar</h3>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, fontFamily: 'sans-serif', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              Seasons run <strong style={{ color: '#1e2b65' }}>May 1 – April 30</strong> (aligned with the NMJL card year). At the start of each new season, ratings undergo a <strong style={{ color: '#1e2b65' }}>soft reset</strong>: New Rating = 800 + 0.6 × (Old Rating - 800). A player at 1000 starts the new season at 920. A player at 700 starts at 740. Your all-time career stats are preserved permanently. There is no rating decay for inactivity — take a break without penalty.
            </div>
          </div>
        </div>
      )}

      {tab === 'nmjl' && (
        <div>
          <p style={{ fontSize: 13, color: '#444', fontFamily: 'sans-serif', lineHeight: 1.7, marginBottom: 16 }}>American Mah Jongg follows rules set by the National Mah Jongg League (NMJL), founded in 1937. It differs significantly from Chinese and Japanese mah jongg.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { title: 'The Card', desc: 'Each year NMJL publishes a new card listing the only winning hands allowed. You must build one of these exact combinations to win.' },
              { title: '4 Players', desc: 'Always played with exactly 4 players. Each starts with 13 tiles, draws one per turn, discards one. First to complete a valid hand wins.' },
              { title: 'Jokers', desc: 'American Mah Jongg uses 8 joker tiles. Jokers substitute for any tile in a set of 3 or more — but never in a pair.' },
              { title: 'Calling tiles', desc: 'You can call any discarded tile to complete your hand — not just the most recent discard.' },
              { title: 'Scoring', desc: 'This league tracks wins and Elo. Winning a hand pays 25¢ per player — monetary scoring stays between players.' },
              { title: 'Where to learn', desc: 'Best free resource: mahjonged.com. The NMJL sells instructional materials at nationalmahjonggleague.org.' },
            ].map(c => (
              <div key={c.title} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
            {[
              { q: 'vs Chinese Mah Jongg', a: 'Chinese mah jongg has no jokers and no annual card. American Mah Jongg is more structured — you must match the card exactly.' },
              { q: 'vs Japanese Riichi', a: 'Riichi is highly strategic with complex point scoring. American Mah Jongg is simpler to score but requires memorizing the annual card.' },
              { q: "I've never played — how long to learn?", a: 'Most new players can play a full game within 2–3 sessions. All clubs welcome beginners — just show up.' },
            ].map(f => <Faq key={f.q} {...f} />)}
          </div>
        </div>
      )}

      {tab === 'conduct' && (
        <div>
          <p style={{ fontSize: 13, color: '#444', fontFamily: 'sans-serif', lineHeight: 1.7, marginBottom: 16 }}>Monmouth Made Mah Jongg is built on friendly competition and mutual respect. All members are expected to uphold the following standards.</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {[
              { title: 'Confirm results honestly', desc: 'When you receive a confirmation request, verify it accurately reflects what happened. Confirming a result you know to be incorrect is grounds for suspension.', warn: false },
              { title: 'Always dispute — never ignore', desc: 'If a submitted result is wrong, hit the Dispute button immediately. Unverified games auto-accept after 48 hours.', warn: false },
              { title: 'Respect all players', desc: 'Treat every player with courtesy regardless of skill level, town, or club.', warn: false },
              { title: 'Play by the rules', desc: 'Follow standard NMJL rules. Disputes should be resolved calmly. If unresolved, contact the league admin.', warn: false },
              { title: 'Record games promptly', desc: 'Submit results within 24 hours of playing. Leaving results unrecorded disrupts rankings and is unfair to other players.', warn: false },
              { title: 'Violations & disputes', desc: 'Report suspected violations via the Contact tab. The admin reviews all reports and may issue warnings, point penalties, or suspensions.', warn: true },
            ].map(c => (
              <div key={c.title} style={{ background: 'white', borderLeft: `3px solid ${c.warn ? '#9f1239' : '#1e2b65'}`, padding: '12px 14px', borderRadius: '0 8px 8px 0', border: '0.5px solid #c8cdd6', borderLeftWidth: 3, borderLeftColor: c.warn ? '#9f1239' : '#1e2b65' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#f4f4f2', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#555', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
            <strong style={{ color: '#1e2b65' }}>Verification policy:</strong> 1 other player must confirm before Elo updates. All results auto-accept after 48 hours if not disputed. Use the Dispute button if a result is incorrect — do not simply ignore it.
          </div>
        </div>
      )}

      {tab === 'hof' && (
        <div>
          <p style={{ fontSize: 13, color: '#444', fontFamily: 'sans-serif', lineHeight: 1.7, marginBottom: 16 }}>County Champions and season award winners are immortalized here. Season 1 runs May 2025 – April 2026.</p>
          <div style={{ background: 'white', border: '0.5px dashed #c8cdd6', borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#888', fontFamily: 'sans-serif' }}>Season 1 is underway — check back April 30, 2026 for the first Hall of Fame inductees.</div>
          </div>
          <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2b65', marginBottom: 12 }}>Season end awards</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { title: 'County Champion', desc: '#1 Elo at season close' },
                { title: 'Most Improved', desc: 'Biggest Elo gain' },
                { title: 'Most Active', desc: 'Most games played' },
                { title: 'Club Champion', desc: 'Top player per club' },
              ].map(a => (
                <div key={a.title} style={{ background: '#f4f4f2', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1e2b65', fontFamily: 'sans-serif' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginTop: 2 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 13, color: '#444', fontFamily: 'sans-serif', lineHeight: 1.7, marginBottom: 16 }}>Have a question, want to start a new club, or need to report an issue? We'll get back to you within 48 hours.</p>
          <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 24 }}>
            <ContactForm />
          </div>
        </div>
      )}
    </div>
  )
}
