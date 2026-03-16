import { useState } from 'react'
import { supabase } from '../supabase'

function RankBadge({ label, bg, color, range }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'sans-serif', color, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 10, fontFamily: 'sans-serif', color, opacity: 0.8 }}>{range}</div>
    </div>
  )
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={() => setOpen(!open)} style={{ padding: '14px 16px', borderBottom: '0.5px solid #e8e8e4', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#1a2744' }}>
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
      <button type="submit" style={{ width: '100%', background: '#1a2744', color: '#f4f4f2', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, fontFamily: 'Playfair Display, serif', fontWeight: 700, cursor: 'pointer' }}>
        Send Message
      </button>
    </form>
  )
}

export default function HowItWorks() {
  const [tab, setTab] = useState('start')
  const [myElo, setMyElo] = useState(1200)
  const [oppElo, setOppElo] = useState(1200)

  const K = 32
  const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400))
  const winGain = Math.round(K * (1 - expected))
  const lossLoss = Math.round(K * expected)
  const gap = oppElo - myElo
  let ctx = 'Evenly matched'
  if (gap > 200) ctx = 'You are the underdog — big upside if you win'
  else if (gap > 100) ctx = 'Opponent is stronger — good chance to gain big'
  else if (gap < -200) ctx = 'You are the heavy favorite — less to gain'
  else if (gap < -100) ctx = 'You are favored — moderate gain if you win'

  const tabs = ['start', 'elo', 'nmjl', 'conduct', 'hof', 'contact']
  const tabLabels = { start: 'Get Started', elo: 'Elo & Ranks', nmjl: 'NMJL Guide', conduct: 'Code of Conduct', hof: 'Hall of Fame', contact: 'Contact' }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>Member Guide</h2>
        <p style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>Everything you need to know about Monmouth Made Mahjong</p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12,
            fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer',
            background: tab === t ? '#1a2744' : 'white',
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
              { n: 4, title: 'Play and record your first match', desc: 'After your game, go to the Record tab and submit the result. All other players at the table get notified to confirm. Once the majority confirm, your Elo updates automatically.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a2744', color: '#f4f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Match confirmation explainer */}
          <div style={{ background: '#eef1f8', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 10 }}>How match confirmation works</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { step: '1', label: 'Winner submits result', desc: 'Any player can record the match result from the Record tab.' },
                { step: '2', label: 'Opponents get notified', desc: 'All other players at the table receive an email and in-app notification.' },
                { step: '3', label: 'Majority must confirm', desc: 'In a 4-player game, 2 of 3 opponents must confirm. In a 2-player game, the 1 opponent must confirm.' },
                { step: '4', label: 'Elo updates', desc: 'Once majority confirms, ratings update automatically and the match is locked in.' },
                { step: '!', label: 'Auto-accept after 48 hours', desc: "If nobody disputes within 48 hours the result is automatically accepted — no matches get stuck forever." },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.step === '!' ? '#9f1239' : '#1a2744', color: s.step === '!' ? 'white' : '#f4f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: 'sans-serif' }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', fontFamily: 'sans-serif' }}>{s.label}</div>
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
              { q: 'How many confirmations does a match need?', a: 'In a standard 4-player game, 2 of the 3 other players must confirm. In a 2-player game, the 1 opponent must confirm. Confirmations are tracked with dot indicators in the app.' },
              { q: 'What happens if someone never confirms?', a: 'After 48 hours the result is automatically accepted. This prevents matches from being stuck forever due to one unresponsive player.' },
              { q: 'What if a match result is wrong?', a: 'Hit the Dispute button instead of Confirm. The match gets flagged and the league admin reviews it. Never just ignore a wrong result — always dispute it.' },
            ].map(f => <Faq key={f.q} {...f} />)}
          </div>
        </div>
      )}

      {tab === 'elo' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', marginBottom: 10 }}>Rank tiers</h3>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', marginBottom: 12 }}>All players start at 800 Elo — right in the Skilled tier.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              <RankBadge label="Novice" bg="#e5e7eb" color="#374151" range="0–699" />
              <RankBadge label="Skilled" bg="#d1fae5" color="#065f46" range="700–999" />
              <RankBadge label="Expert" bg="#dbeafe" color="#1e40af" range="1,000–1,299" />
              <RankBadge label="Master" bg="#9f1239" color="white" range="1,300–1,599" />
              <RankBadge label="Grand Master" bg="#1a2744" color="#f0c040" range="1,600+" />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Elo calculator</h3>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', marginBottom: 12 }}>Drag the sliders to see exactly how points change hands.</p>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 2 }}>Your Elo</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>{myElo.toLocaleString()}</div>
                  <input type="range" min="500" max="1800" value={myElo} onChange={e => setMyElo(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 2 }}>Opponent's Elo</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>{oppElo.toLocaleString()}</div>
                  <input type="range" min="500" max="1800" value={oppElo} onChange={e => setOppElo(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginBottom: 12 }}>{ctx}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#d1fae5', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, color: '#065f46', marginBottom: 3 }}>If you WIN</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#065f46' }}>+{winGain}</div>
                </div>
                <div style={{ background: '#fee2e2', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, color: '#991b1b', marginBottom: 3 }}>If you LOSE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#991b1b' }}>−{lossLoss}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>How Elo works in a 4-player game</h3>
            <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 16, fontFamily: 'sans-serif', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              In a 4-player game, the winner's Elo change is calculated against the <strong style={{ color: '#1a2744' }}>average Elo of all three opponents</strong>. Each loser's change is calculated individually against the winner's Elo. This means beating a table of strong players earns you more than beating weaker ones.
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Season calendar</h3>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>Seasons run May 1 – April 30. On May 1 each year ratings soft-reset — everyone moves 25% back toward 1,000. A Grand Master at 1,600 starts the new season at 1,450. Progress carries forward, competition stays fresh.</p>
          </div>
        </div>
      )}

      {tab === 'nmjl' && (
        <div>
          <p style={{ fontSize: 13, color: '#444', fontFamily: 'sans-serif', lineHeight: 1.7, marginBottom: 16 }}>American Mahjong follows rules set by the National Mah Jongg League (NMJL), founded in 1937. It differs significantly from Chinese and Japanese mahjong.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { title: 'The Card', desc: 'Each year NMJL publishes a new card listing the only winning hands allowed. You must build one of these exact combinations to win.' },
              { title: '4 Players', desc: 'Always played with exactly 4 players. Each starts with 13 tiles, draws one per turn, discards one. First to complete a valid hand wins.' },
              { title: 'Jokers', desc: 'American mahjong uses 8 joker tiles. Jokers substitute for any tile in a set of 3 or more — but never in a pair.' },
              { title: 'Calling tiles', desc: 'You can call any discarded tile to complete your hand — not just the most recent discard.' },
              { title: 'Scoring', desc: 'This league tracks wins and Elo. Winning a hand pays 25¢ per player — monetary scoring stays between players.' },
              { title: 'Where to learn', desc: 'Best free resource: mahjonged.com. The NMJL sells instructional materials at nationalmahjonggleague.org.' },
            ].map(c => (
              <div key={c.title} style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', border: '0.5px solid #c8cdd6', borderRadius: 10, overflow: 'hidden' }}>
            {[
              { q: 'vs Chinese Mahjong', a: 'Chinese mahjong has no jokers and no annual card. American mahjong is more structured — you must match the card exactly.' },
              { q: 'vs Japanese Riichi', a: 'Riichi is highly strategic with complex point scoring. American mahjong is simpler to score but requires memorizing the annual card.' },
              { q: "I've never played — how long to learn?", a: 'Most new players can play a full game within 2–3 sessions. All clubs welcome beginners — just show up.' },
            ].map(f => <Faq key={f.q} {...f} />)}
          </div>
        </div>
      )}

      {tab === 'conduct' && (
        <div>
          <p style={{ fontSize: 13, color: '#444', fontFamily: 'sans-serif', lineHeight: 1.7, marginBottom: 16 }}>Monmouth Made Mahjong is built on friendly competition and mutual respect. All members are expected to uphold the following standards.</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {[
              { title: 'Confirm results honestly', desc: 'When you receive a match confirmation request, verify it accurately reflects what happened. Confirming a result you know to be incorrect is grounds for suspension.', warn: false },
              { title: 'Always dispute — never ignore', desc: 'If a submitted match result is wrong, hit the Dispute button immediately. Do not simply ignore the notification — unconfirmed matches auto-accept after 48 hours.', warn: false },
              { title: 'Respect all players', desc: 'Treat every player with courtesy regardless of skill level, town, or club.', warn: false },
              { title: 'Play by the rules', desc: 'Follow standard NMJL rules. Disputes should be resolved calmly. If unresolved, contact the league admin.', warn: false },
              { title: 'Record games promptly', desc: 'Submit match results within 24 hours of playing. Leaving results unrecorded disrupts rankings and is unfair to other players.', warn: false },
              { title: 'Violations & disputes', desc: 'Report suspected violations via the Contact tab. The admin reviews all reports and may issue warnings, point penalties, or suspensions.', warn: true },
            ].map(c => (
              <div key={c.title} style={{ background: 'white', borderLeft: `3px solid ${c.warn ? '#9f1239' : '#1a2744'}`, padding: '12px 14px', borderRadius: '0 8px 8px 0', border: '0.5px solid #c8cdd6', borderLeftWidth: 3, borderLeftColor: c.warn ? '#9f1239' : '#1a2744' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#f4f4f2', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#555', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
            <strong style={{ color: '#1a2744' }}>Match confirmation policy:</strong> In a 4-player game, 2 of 3 opponents must confirm before Elo updates. In a 2-player game, the 1 opponent must confirm. All results auto-accept after 48 hours if not disputed. Use the Dispute button if a result is incorrect — do not simply ignore it.
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
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 12 }}>Season end awards</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { title: 'County Champion', desc: '#1 Elo at season close' },
                { title: 'Most Improved', desc: 'Biggest Elo gain' },
                { title: 'Most Active', desc: 'Most games played' },
                { title: 'Club Champion', desc: 'Top player per club' },
              ].map(a => (
                <div key={a.title} style={{ background: '#f4f4f2', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2744', fontFamily: 'sans-serif' }}>{a.title}</div>
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