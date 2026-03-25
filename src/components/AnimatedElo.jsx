import { useState, useEffect, useRef } from 'react'

const C = {
  jade: '#065F46', jadeLt: '#059669', crimson: '#DC2626',
}

export default function AnimatedElo({ value, style = {} }) {
  const [display, setDisplay] = useState(value)
  const [animColor, setAnimColor] = useState(null)
  const prevRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    const prev = prevRef.current
    const delta = value - prev
    prevRef.current = value

    if (delta === 0 || prev === value) {
      setDisplay(value)
      return
    }

    // Set color based on gain/loss
    setAnimColor(delta > 0 ? C.jadeLt : C.crimson)

    const duration = 600
    const start = performance.now()
    const from = prev

    function tick(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // Cubic ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(from + delta * eased)
      setDisplay(current)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Reset color after 1.2s
        setTimeout(() => setAnimColor(null), 600)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return (
    <span style={{
      ...style,
      color: animColor || style.color,
      transition: 'color 0.3s ease',
      ...(animColor ? { textShadow: `0 0 30px ${animColor}25` } : {}),
    }}>
      {display}
    </span>
  )
}
