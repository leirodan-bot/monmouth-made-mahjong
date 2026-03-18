export default function LegalPage({ title, effectiveDate, children, setTab }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Back link */}
      <button
        onClick={() => setTab('rankings')}
        style={{
          background: 'none', border: 'none', fontSize: 13, fontFamily: 'sans-serif',
          color: '#1e2b65', cursor: 'pointer', padding: '0 0 16px', display: 'flex',
          alignItems: 'center', gap: 6
        }}
      >
        <span style={{ fontSize: 16 }}>←</span> Back to Rankings
      </button>

      {/* Title */}
      <h1 style={{
        fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700,
        color: '#1e2b65', marginBottom: 6, textAlign: 'center'
      }}>
        {title}
      </h1>
      <p style={{
        textAlign: 'center', fontSize: 13, fontFamily: 'sans-serif',
        color: '#888', fontStyle: 'italic', marginBottom: 32
      }}>
        Effective Date: {effectiveDate}
      </p>

      {/* Content */}
      <div style={{
        background: 'white', borderRadius: 10, border: '0.5px solid #c8cdd6',
        padding: '32px 28px', fontFamily: 'sans-serif', fontSize: 13.5,
        lineHeight: 1.7, color: '#333'
      }}>
        {children}
      </div>
    </div>
  )
}

/* Reusable styled sub-components */
export function Section({ number, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700,
        color: '#1e2b65', marginBottom: 10
      }}>
        {number}. {title}
      </h2>
      {children}
    </div>
  )
}

export function SubSection({ number, title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700,
        color: '#1e2b65', marginBottom: 8
      }}>
        {number} {title}
      </h3>
      {children}
    </div>
  )
}

export function P({ children, caps }) {
  return (
    <p style={{
      marginBottom: 12,
      ...(caps ? { textTransform: 'uppercase', fontWeight: 600, fontSize: 12.5, letterSpacing: 0.3 } : {})
    }}>
      {children}
    </p>
  )
}