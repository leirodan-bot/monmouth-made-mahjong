const C = {
  jade: '#065F46', midnight: '#0F172A', slate: '#64748B', slateLt: '#94A3B8', border: '#E2E8F0',
}

export default function LegalPage({ title, effectiveDate, children, setTab }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <button onClick={() => setTab('rankings')} style={{
        background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
        color: C.midnight, cursor: 'pointer', padding: '6px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6
      }}>
        ← Back to Rankings
      </button>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700, color: C.midnight, marginBottom: 6, textAlign: 'center' }}>{title}</h1>
      <p style={{ textAlign: 'center', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: C.slateLt, marginBottom: 32, letterSpacing: 0.5 }}>Effective: {effectiveDate}</p>
      <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${C.border}`, padding: '32px 28px', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.7, color: '#374151' }}>{children}</div>
    </div>
  )
}

export function Section({ number, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: C.midnight, marginBottom: 10 }}>{number}. {title}</h2>
      {children}
    </div>
  )
}

export function SubSection({ number, title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: C.midnight, marginBottom: 8 }}>{number} {title}</h3>
      {children}
    </div>
  )
}

export function P({ children, caps }) {
  return <p style={{ marginBottom: 12, ...(caps ? { textTransform: 'uppercase', fontWeight: 600, fontSize: 12.5, letterSpacing: 0.3 } : {}) }}>{children}</p>
}
