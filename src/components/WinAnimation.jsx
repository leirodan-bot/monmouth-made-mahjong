import { useState, useEffect, useRef } from 'react'
import { C, fonts } from '../theme'

// Mahjong tile characters for the animation
const TILE_FACES = ['🀄', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘', '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡']

function randomBetween(a, b) { return a + Math.random() * (b - a) }
function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// A single animated tile that flips, floats up, and fades
function AnimatedTile({ delay, startX, startY, face }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return null

  const drift = randomBetween(-40, 40)
  const dur = randomBetween(1.4, 2.2)
  const flipDur = randomBetween(0.5, 0.8)
  const size = randomBetween(36, 56)

  return (
    <div style={{
      position: 'absolute',
      left: startX,
      top: startY,
      fontSize: size,
      lineHeight: 1,
      animation: `tileFloat ${dur}s ease-out forwards`,
      '--drift': `${drift}px`,
      zIndex: 1000,
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
    }}>
      <div style={{
        animation: `tileFlip ${flipDur}s ease-in-out`,
        transformStyle: 'preserve-3d',
      }}>
        {face}
      </div>
    </div>
  )
}

// Sparkle particle
function Sparkle({ delay, x, y }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return null

  const size = randomBetween(4, 10)
  const dur = randomBetween(0.6, 1.2)
  const color = randomPick([C.gold, C.crimson, C.jadeLt, '#FFD700', '#FF6B6B'])

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      animation: `sparkle ${dur}s ease-out forwards`,
      pointerEvents: 'none',
      zIndex: 999,
    }} />
  )
}

export default function WinAnimation({ onComplete, winnerName }) {
  const containerRef = useRef(null)
  const [phase, setPhase] = useState('tiles') // 'tiles' -> 'message' -> 'done'
  const [tiles, setTiles] = useState([])
  const [sparkles, setSparkles] = useState([])

  useEffect(() => {
    // Generate tile positions spread across the screen
    const w = window.innerWidth
    const h = window.innerHeight
    const numTiles = 18
    const numSparkles = 30

    const newTiles = Array.from({ length: numTiles }, (_, i) => ({
      id: i,
      delay: i * 80 + randomBetween(0, 60),
      startX: randomBetween(w * 0.1, w * 0.9),
      startY: randomBetween(h * 0.3, h * 0.8),
      face: randomPick(TILE_FACES),
    }))

    const newSparkles = Array.from({ length: numSparkles }, (_, i) => ({
      id: i,
      delay: randomBetween(200, 1800),
      x: randomBetween(w * 0.05, w * 0.95),
      y: randomBetween(h * 0.15, h * 0.85),
    }))

    setTiles(newTiles)
    setSparkles(newSparkles)

    // Show the "You Won!" message after tiles start
    const msgTimer = setTimeout(() => setPhase('message'), 600)
    // Auto-dismiss after animation completes
    const doneTimer = setTimeout(() => {
      setPhase('done')
      if (onComplete) onComplete()
    }, 3500)

    return () => {
      clearTimeout(msgTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  return (
    <>
      {/* CSS Keyframes */}
      <style>{`
        @keyframes tileFloat {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.3) rotate(0deg); }
          15% { opacity: 1; transform: translateY(-20px) scale(1.1) rotate(15deg); }
          50% { opacity: 1; transform: translateY(-80px) translateX(var(--drift)) scale(1) rotate(-10deg); }
          100% { opacity: 0; transform: translateY(-200px) translateX(calc(var(--drift) * 2)) scale(0.6) rotate(25deg); }
        }
        @keyframes tileFlip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0); }
          30% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0) translateY(-30px); }
        }
        @keyframes winBadgePop {
          0% { opacity: 0; transform: scale(0) rotate(-10deg); }
          50% { opacity: 1; transform: scale(1.15) rotate(3deg); }
          70% { transform: scale(0.95) rotate(-1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes winGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
          50% { box-shadow: 0 0 40px rgba(245,158,11,0.6), 0 0 80px rgba(225,29,72,0.2); }
        }
        @keyframes winFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Full-screen overlay */}
      <div ref={containerRef} style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: phase === 'done' ? 'none' : 'auto',
        background: 'rgba(28,25,23,0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: phase === 'done' ? 'winFadeOut 0.5s ease-out forwards' : undefined,
      }}
        onClick={() => { setPhase('done'); if (onComplete) onComplete() }}
      >
        {/* Floating tiles */}
        {tiles.map(t => (
          <AnimatedTile key={t.id} {...t} />
        ))}

        {/* Sparkles */}
        {sparkles.map(s => (
          <Sparkle key={`s-${s.id}`} {...s} />
        ))}

        {/* Center message */}
        {phase === 'message' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            animation: 'winBadgePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            zIndex: 10000,
          }}>
            {/* Trophy circle */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'winGlow 1.5s ease-in-out infinite',
              boxShadow: '0 4px 30px rgba(245,158,11,0.4)',
            }}>
              <span style={{ fontSize: 50, lineHeight: 1 }}>🏆</span>
            </div>

            {/* Winner text */}
            <div style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 800,
              color: '#FFD700',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              letterSpacing: -0.5,
              marginBottom: 8,
            }}>
              You Won!
            </div>

            {winnerName && (
              <div style={{
                fontFamily: fonts.body,
                fontSize: 16,
                color: 'rgba(255,255,255,0.8)',
                textShadow: '0 1px 8px rgba(0,0,0,0.4)',
              }}>
                Congrats, {winnerName}!
              </div>
            )}

            <div style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 24,
            }}>
              Tap anywhere to continue
            </div>
          </div>
        )}
      </div>
    </>
  )
}
