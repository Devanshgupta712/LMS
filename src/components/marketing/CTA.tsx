import Link from 'next/link';

export default function CTA() {
  return (
    <section className="noise-overlay" style={{ 
      padding: '120px 0', 
      background: '#09090b', 
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Stripe-style Glow Background */}
      <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, hsla(var(--primary-h), 80%, 40%, 0.15) 0%, transparent 60%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px', background: 'var(--primary)', borderRadius: '50%', opacity: 0.1, filter: 'blur(100px)' }}></div>
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'var(--accent)', borderRadius: '50%', opacity: 0.05, filter: 'blur(100px)' }}></div>

      <div className="container-wide" style={{ maxWidth: '1000px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '6px 16px', 
          background: 'rgba(255,255,255,0.08)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '100px', 
          color: 'hsla(var(--primary-h), 80%, 70%, 1)', 
          fontSize: '13px', 
          fontWeight: 600, 
          letterSpacing: '0.1em', 
          marginBottom: '48px',
          textTransform: 'uppercase'
        }}>
          ⚡ Registration Closes Soon
        </div>

        <h2 style={{ fontSize: 'clamp(40px, 8vw, 84px)', fontWeight: 600, marginBottom: '32px', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
          Stop Learning. <br />
          <span style={{ 
            background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Start Applying.
          </span>
        </h2>
        
        <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '56px', maxWidth: '700px', margin: '0 auto', fontWeight: 500 }}>
          Join the next cohort and get your MNC experience certificate while you learn. 
          The first 10 students receive a technical scholarship.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary shadow-premium hover-lift" style={{ 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)', 
            padding: '22px 64px', 
            borderRadius: '14px', 
            fontSize: '20px', 
            fontWeight: 700,
            transition: 'all 0.3s ease',
            boxShadow: '0 0 40px rgba(255,255,255,0.15)'
          }}>
            Secure My Slot
          </Link>
        </div>
        
        <div style={{ marginTop: '32px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600 }}>
          Only 4 slots remaining for the April Batch
        </div>
      </div>
    </section>
  );
}
