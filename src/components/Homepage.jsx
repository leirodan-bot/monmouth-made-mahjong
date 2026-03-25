import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import logoWhite from '../assets/mahjrank/mahjranklogomonowhite1800.png'

const C = {
  jade: '#065F46', jadeLt: '#059669', jadePale: '#ECFDF5',
  crimson: '#DC2626', crimsonLt: '#EF4444', crimsonPale: '#FEF2F2',
  gold: '#F59E0B', goldDk: '#D97706', goldPale: '#FFFBEB',
  midnight: '#0F172A', ink: '#1E293B',
  cloud: '#F8FAFC', white: '#FFFFFF',
  slate: '#64748B', slateLt: '#94A3B8', slateXlt: '#CBD5E1',
  border: '#E2E8F0', borderLt: '#F1F5F9',
}

export default function Homepage({ setTab }) {
  const [topPlayers, setTopPlayers] = useState([])
  const [stats, setStats] = useState({ players: 0, games: 0, clubs: 0 })
  const revealRefs = useRef([])

  useEffect(() => {
    fetchLeaderboard()
    fetchStats()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' })
    revealRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [topPlayers])

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
      .limit(5)
    if (data) setTopPlayers(data)
  }

  async function fetchStats() {
    const [playersRes, gamesRes, clubsRes] = await Promise.all([
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('clubs').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      players: playersRes.count || 0,
      games: gamesRes.count || 0,
      clubs: clubsRes.count || 0,
    })
  }

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  const rankColors = [C.gold, '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)']

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>

      {/* ===== HERO ===== */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.midnight,
        overflow: 'hidden',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(6,95,70,0.08) 0%, transparent 70%)',
        }} />

        <img
          src={logoWhite}
          alt="MahjRank"
          style={{
            width: 'min(480px, 75vw)',
            marginBottom: '2.5rem',
            animation: 'mr-fadeUp 1s ease-out 0.2s both',
          }}
        />

        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 400,
          letterSpacing: '0.04em',
          marginBottom: '1rem',
          animation: 'mr-fadeUp 1s ease-out 0.5s both',
        }}>
          Track your game. Climb the ranks. Know your <em style={{ color: C.gold, fontStyle: 'italic' }}>number.</em>
        </p>

        <p style={{
          fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)',
          color: 'rgba(255,255,255,0.4)',
          maxWidth: 480,
          lineHeight: 1.7,
          marginBottom: '2.8rem',
          fontFamily: "'DM Sans', sans-serif",
          animation: 'mr-fadeUp 1s ease-out 0.7s both',
        }}>
          The first Elo rating platform for in-person American Mahjong. Log games, earn badges, and see where you rank.
        </p>

        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'mr-fadeUp 1s ease-out 0.9s both',
        }}>
          <button
            onClick={() => setTab('players')}
            style={{
              padding: '14px 36px', borderRadius: 50, border: 'none',
              background: C.crimson, color: '#fff',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.02em',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
            }}
            onMouseEnter={e => { e.target.style.background = '#EF4444'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(220,38,38,0.4)' }}
            onMouseLeave={e => { e.target.style.background = C.crimson; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(220,38,38,0.3)' }}
          >
            Get Started — Free
          </button>
          <button
            onClick={() => setTab('players')}
            style={{
              padding: '14px 36px', borderRadius: 50,
              background: 'transparent', color: '#ffffff',
              border: '1.5px solid rgba(255,255,255,0.25)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.02em',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'transparent' }}
          >
            Sign In
          </button>
        </div>

        <div style={{
          position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          animation: 'mr-fadeUp 1s ease-out 1.2s both',
        }}>
          <div style={{
            width: 24, height: 38, border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 12, position: 'relative',
          }}>
            <div style={{
              width: 4, height: 8, background: 'rgba(255,255,255,0.4)',
              borderRadius: 2, position: 'absolute', top: 6, left: '50%',
              transform: 'translateX(-50%)',
              animation: 'mr-scrollBounce 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <div style={{
        background: C.ink, padding: '1.4rem 2rem',
        display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap',
        borderTop: `1px solid rgba(6,95,70,0.2)`,
      }}>
        {[
          { num: stats.players || '—', label: 'Players' },
          { num: stats.games ? stats.games.toLocaleString() : '—', label: 'Games Logged' },
          { num: stats.clubs || '—', label: 'Clubs' },
          { num: 'Season 1', label: 'May 2025 – Apr 2026' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', color: '#fff' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.6rem', fontWeight: 700, color: C.gold, display: 'block' }}>{s.num}</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ===== WHAT IS THIS ===== */}
      <section style={{ padding: '5rem 2rem', background: C.cloud }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.jade, fontWeight: 600, marginBottom: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>What is MahjRank?</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: C.midnight, lineHeight: 1.2, marginBottom: '1.2rem' }}>
            Your Mahjong game,<br />finally measured.
          </h2>
          <p style={{ fontSize: '1.05rem', color: C.slate, lineHeight: 1.8, maxWidth: 640, fontFamily: "'DM Sans', sans-serif" }}>
            MahjRank is the first platform to bring Elo-based skill ratings to in-person American Mahjong. Track your wins, earn badges, and see how you stack up — whether you play at the community center, your friend's kitchen table, or a tournament.
          </p>

          <div ref={addRevealRef} style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '4rem', alignItems: 'center', marginTop: '3rem',
            opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s ease',
          }}>
            <div style={{
              background: C.midnight, borderRadius: 20, padding: '3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280,
            }}>
              <img src={logoWhite} alt="MahjRank" style={{ width: '80%' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              {[
                { icon: '📊', title: 'Elo-Rated Rankings', desc: 'The same rating system used in chess, adapted for 4-player Mahjong. Every game counts toward your rating.', accent: C.jade },
                { icon: '🏅', title: 'Badges & Achievements', desc: 'Earn recognition for milestones — first win, win streaks, climbing the leaderboard, and more.', accent: C.gold },
                { icon: '🏠', title: 'Club Management', desc: 'Organize your group, track club stats, and run seasonal leagues all in one place.', accent: C.jadeLt },
                { icon: '📱', title: 'Works Like an App', desc: 'Install it right from your browser — no app store needed. Log games on your phone at the table.', accent: C.crimson },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  background: 'white', borderRadius: 14, padding: '1.2rem 1.4rem',
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${f.accent}`,
                }}>
                  <div style={{
                    width: 44, height: 44, background: C.cloud, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem',
                    border: `1px solid ${C.border}`,
                  }}>{f.icon}</div>
                  <div>
                    <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', color: C.midnight, marginBottom: '0.3rem' }}>{f.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: C.slate, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '5rem 2rem', background: '#ffffff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.jade, fontWeight: 600, marginBottom: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>How it works</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: C.midnight, lineHeight: 1.2, marginBottom: '1.2rem' }}>
            Three steps to the table.
          </h2>
          <p style={{ fontSize: '1.05rem', color: C.slate, lineHeight: 1.8, maxWidth: 640, fontFamily: "'DM Sans', sans-serif" }}>
            Getting started takes less than a minute.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem', marginTop: '3.5rem' }}>
            {[
              { num: '1', icon: '✍️', title: 'Sign Up & Join a Club', desc: 'Create your free account and join your Mahjong group — or start a new one. Every player starts with an 800 Elo rating.', accent: C.jade },
              { num: '2', icon: '🀄', title: 'Play & Log Your Games', desc: 'After each session, log who played and who won. It takes 30 seconds. Other players verify the result for accuracy.', accent: C.crimson },
              { num: '3', icon: '🏆', title: 'Watch Your Rating Rise', desc: 'Your Elo rating updates after every verified game. Track your progress, earn badges, and climb the leaderboard.', accent: C.gold },
            ].map((s, i) => (
              <div
                key={i}
                ref={addRevealRef}
                style={{
                  position: 'relative', background: C.cloud,
                  borderRadius: 20,
                  padding: '2.5rem 2rem 2rem',
                  border: `1px solid ${C.border}`,
                  borderTop: `4px solid ${s.accent}`,
                  transition: 'all 0.3s ease',
                  opacity: 0, transform: 'translateY(30px)',
                  transitionDelay: `${i * 0.15}s`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(15,23,42,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '3.5rem', fontWeight: 700,
                  color: s.accent, opacity: 0.15, position: 'absolute', top: '1rem', right: '1.5rem', lineHeight: 1,
                }}>{s.num}</span>
                <div style={{
                  width: 56, height: 56, background: 'white', borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', color: C.midnight, marginBottom: '0.6rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', color: C.slate, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LEADERBOARD PREVIEW ===== */}
      <section style={{
        background: C.midnight, color: '#fff', padding: '5rem 2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(6,95,70,0.06), transparent)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.gold, fontWeight: 600, marginBottom: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>Rankings</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '1.2rem' }}>
            Who's on top?
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 640, fontFamily: "'DM Sans', sans-serif" }}>
            The current Season 1 leaderboard, ranked by Elo rating.
          </p>

          <div ref={addRevealRef} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, marginTop: '3rem', overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s ease',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', color: '#fff', margin: 0 }}>Season 1 Leaderboard</h3>
              <span style={{
                fontSize: '0.7rem', color: C.gold, textTransform: 'uppercase',
                letterSpacing: '0.15em', background: 'rgba(245,158,11,0.1)',
                padding: '0.35rem 0.9rem', borderRadius: 20, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              }}>Live</span>
            </div>

            {topPlayers.length > 0 ? topPlayers.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', padding: '1rem 2rem',
                borderBottom: i < topPlayers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                borderLeft: i === 0 ? `4px solid ${C.gold}` : '4px solid transparent',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{
                  width: 50, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  fontSize: '1.1rem', color: rankColors[i] || 'rgba(255,255,255,0.3)',
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontWeight: 500, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem' }}>{p.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", width: 100, textAlign: 'right', marginRight: 24 }}>
                  {p.wins || 0}W – {p.losses || 0}L
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: C.crimson,
                  fontSize: '1rem', width: 60, textAlign: 'right',
                }}>{p.elo ? Math.round(p.elo).toLocaleString() : '—'}</span>
              </div>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
                Be the first to join and claim the #1 spot.
              </div>
            )}

            <div style={{ padding: '1.2rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setTab('rankings')}
                style={{
                  background: 'none', border: 'none', color: C.gold, cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                View Full Rankings →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: C.cloud }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.jade, fontWeight: 600, marginBottom: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>Ready to play?</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: C.midnight, lineHeight: 1.2, marginBottom: '1rem' }}>
            Your seat at the table is waiting.
          </h2>
          <p style={{ fontSize: '1.05rem', color: C.slate, lineHeight: 1.8, maxWidth: 640, margin: '0 auto 2.5rem', fontFamily: "'DM Sans', sans-serif" }}>
            Join MahjRank today — it's free. Start tracking your games, earning your rating, and connecting with players everywhere.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTab('players')}
              style={{
                padding: '14px 36px', borderRadius: 50, border: 'none',
                background: C.crimson, color: '#fff',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(220,38,38,0.25)',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(220,38,38,0.3)' }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(220,38,38,0.25)' }}
            >
              Create Your Free Account
            </button>
            <button
              onClick={() => setTab('howitworks')}
              style={{
                padding: '14px 36px', borderRadius: 50,
                background: 'transparent', color: C.midnight,
                border: `1.5px solid ${C.border}`,
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.target.style.borderColor = C.midnight }}
              onMouseLeave={e => { e.target.style.borderColor = C.border }}
            >
              Learn About Elo Ratings
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        background: C.midnight, color: 'rgba(255,255,255,0.4)', padding: '2.5rem 2rem',
        textAlign: 'center', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif",
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Rankings', tab: 'rankings' },
            { label: 'How It Works', tab: 'howitworks' },
            { label: 'Terms of Service', tab: 'terms' },
            { label: 'Privacy Policy', tab: 'privacy' },
          ].map(link => (
            <button
              key={link.tab}
              onClick={() => setTab(link.tab)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = C.gold}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
              {link.label}
            </button>
          ))}
        </div>
        <p style={{ margin: 0 }}>MahjRank™ · Season 1 · 2025–2026</p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>© 2025 MahjRank. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes mr-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mr-scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
          50% { transform: translateX(-50%) translateY(10px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
