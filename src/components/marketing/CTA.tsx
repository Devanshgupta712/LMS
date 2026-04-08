import Link from 'next/link';

export default function CTA() {
  return (
    <section style={{ 
      padding: '120px 0', 
      background: 'var(--primary)', 
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Background Patterns */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 70% 30%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)', zIndex: 0 }} />
      
      <div className="container-wide" style={{ maxWidth: '1000px', textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 40px' }}>
        <h2 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800, marginBottom: '32px', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
          Stop Learning. <br />
          Start Applying.
        </h2>
        
        <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '48px', maxWidth: '640px', margin: '0 auto', fontWeight: 500 }}>
          Join the next cohort and get your MNC experience certificate while you learn. 
          Limited slots available for the upcoming batch.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ 
            background: '#fff', 
            color: 'var(--primary)', 
            padding: '18px 52px', 
            borderRadius: '10px', 
            fontSize: '18px', 
            fontWeight: 700,
            transition: 'all 0.3s ease',
            boxShadow: 'var(--shadow-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-premium)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          >
            Enroll For Free
          </Link>
        </div>
        
        <div style={{ marginTop: '32px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600 }}>
          ⚡ Batch starting soon. Only a few seats left!
        </div>
      </div>
    </section>
  );
}
