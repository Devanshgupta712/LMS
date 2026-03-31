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
    <section style={{ padding: '120px 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, hsla(var(--primary-h), 80%, 60%, 0.03) 0%, transparent 70%)', zIndex: 0 }} />
      
      <div className="container-wide" style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', padding: '0 var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 600, marginBottom: '24px', letterSpacing: '-0.04em' }}>Loved by 70k+ Students</h2>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Success stories that redefine technical education in India.</p>
        </div>

        <div className="grid-3">
          {reviews.map((r, i) => (
            <TestimonialCard key={i} {...r} />
          ))}
        </div>
      </div>
    </section>
  );
}
