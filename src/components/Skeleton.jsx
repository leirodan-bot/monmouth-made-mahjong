const shimmer = `
@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

const base = {
  background: 'linear-gradient(90deg, #e8ecf0 25%, #f3f5f7 50%, #e8ecf0 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  borderRadius: 6,
}

export function SkeletonLine({ width = '100%', height = 14 }) {
  return <div style={{ ...base, width, height }} />
}

export function SkeletonCircle({ size = 28 }) {
  return <div style={{ ...base, width: size, height: size, borderRadius: '50%' }} />
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <SkeletonCircle size={36} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="60%" height={14} />
          <div style={{ marginTop: 6 }}><SkeletonLine width="40%" height={10} /></div>
        </div>
      </div>
      <SkeletonLine width="100%" height={10} />
    </div>
  )
}

export function RankingSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderBottom: i < 4 ? '1px solid #E2E8F0' : 'none' }}>
            <SkeletonLine width={28} height={28} />
            <SkeletonCircle size={32} />
            <div style={{ flex: 1 }}>
              <SkeletonLine width="50%" height={14} />
              <div style={{ marginTop: 4 }}><SkeletonLine width="30%" height={10} /></div>
            </div>
            <SkeletonLine width={50} height={20} />
          </div>
        ))}
      </div>
    </>
  )
}

export function ProfileSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ margin: '0 auto 12px', ...base, width: 64, height: 64, borderRadius: 16 }} />
        <SkeletonLine width="40%" height={20} />
        <div style={{ margin: '12px auto 0', ...base, width: 80, height: 24, borderRadius: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 20 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ ...base, height: 60, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    </>
  )
}

export function ActivitySkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: i < 3 ? '1px solid #E2E8F0' : 'none' }}>
            <div style={{ ...base, width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <SkeletonLine width="70%" height={14} />
              <div style={{ marginTop: 6 }}><SkeletonLine width="45%" height={10} /></div>
            </div>
            <SkeletonLine width={40} height={10} />
          </div>
        ))}
      </div>
    </>
  )
}
