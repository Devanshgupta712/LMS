'use client';

export default function TrustedBy() {
  const MNCs = [
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 
    'Deloitte', 'Accenture', 'TCS', 'Infosys', 'Wipro'
  ];

  return (
    <section style={{ 
      padding: '32px 0', 
      background: 'var(--card-bg)', 
      borderTop: '1px solid var(--border)', 
      borderBottom: '1px solid var(--border)', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.2em' 
        }}>
          Our Alumni Work At
        </p>
      </div>

      <div className="logo-strip-container" style={{
        display: 'flex',
        overflow: 'hidden',
        userSelect: 'none',
        gap: '60px'
      }}>
        <div className="logo-strip" style={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '60px',
          minWidth: '100%',
          animation: 'scroll-strip 30s linear infinite'
        }}>
          {[...MNCs, ...MNCs].map((logo, i) => (
            <div key={i} style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              opacity: 0.4,
              filter: 'grayscale(100%)',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.filter = 'grayscale(0%)'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.filter = 'grayscale(100%)'; }}
            >
              {logo}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-strip {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
