'use client';

const TestimonialCard = ({ quote, author, role, company }: { quote: string, author: string, role: string, company: string }) => {
  return (
    <div className="glass-premium" style={{ 
      padding: '40px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px',
      height: '100%'
    }}>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, fontStyle: 'italic' }}>
        "{quote}"
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--border)' }}></div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{author}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{role} @ <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{company}</span></div>
        </div>
      </div>
    </div>
  );
};

export default function Testimonials() {
  const reviews = [
    {
      quote: "The 6-month experience certificate was a game-changer. I was treated like a senior hire during my interviews at Amazon.",
      author: "Rahul Sharma",
      role: "SDE-1",
      company: "Amazon"
    },
    {
      quote: "Unlimited interview calls meant I could fail, learn, and try again until I cracked my dream job at Microsoft.",
      author: "Priya Patel",
      role: "Product Engineer",
      company: "Microsoft"
    },
    {
      quote: "Not just another bootcamp. The focus on real-world MNC workflow is something no one else is providing in India.",
      author: "Amit Verma",
      role: "Frontend Lead",
      company: "Deloitte"
    }
  ];

  return (
    <section style={{ padding: '100px 0', background: '#fff' }}>
      <div className="container-wide" style={{ maxWidth: '1280px', padding: '0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 800, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '20px'
          }}>
            Loved by 70k+ Students
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Success stories that redefine technical education.</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '32px'
        }}>
          {reviews.map((r, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '40px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: '#fff',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--primary-glow)'; }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, fontWeight: 500 }}>
                "{r.quote}"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  background: 'var(--bg-secondary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--primary)'
                }}>
                  {r.author.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.author}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {r.role} @ <span style={{ color: 'var(--primary)' }}>{r.company}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
