'use client';

import { useEffect, useRef } from 'react';

const features = [
  { icon: '🚀', title: 'Live Project Experience', desc: 'Work on actual projects currently being developed in software companies.' },
  { icon: '📜', title: 'IT Company Certificate', desc: 'Get a 6-month experience certificate that employers recognize globally.' },
  { icon: '🤖', title: 'AI-Powered Support', desc: 'Use AI for placement, interview preparation, and real-time guidance.' },
  { icon: '💼', title: '50% Fees After Placement', desc: 'Pay 50% of your course fees only after getting placed in a reputed company.' },
  { icon: '🗓️', title: 'Flexible Batches', desc: 'Learn online or offline with evening and weekend schedules available.' },
  { icon: '🌟', title: 'Industry Experts', desc: 'Training provided by working professionals from top IT firms.' }
];

export default function Features() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.feature-item');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section-padding" style={{ padding: 'var(--space-24) 0', background: 'var(--bg-primary)' }}>
      <div className="container-wide" style={{ maxWidth: '1240px', padding: '0 var(--space-8)' }}>
        <div style={{ textAlign: 'left', marginBottom: 'var(--space-20)', maxWidth: '800px' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', letterSpacing: '0.2em', marginBottom: 'var(--space-4)', textTransform: 'uppercase' }}>THE DIFFERENCE</div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, marginBottom: 'var(--space-6)', color: 'var(--text-primary)', lineHeight: 1 }}>How AppTechno Prepares You for the Real World.</h2>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6 }}>
            Traditional training stops at theory. We bridge the gap with an immersion program that feels like your first job.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="reveal-on-scroll"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: 'var(--space-12)', 
                alignItems: 'center',
                direction: i % 2 === 1 ? 'rtl' : 'ltr'
              }}
            >
              {/* Image Side (Alternating) */}
              <div style={{ direction: 'ltr' }}>
                <div 
                  className="hover-lift shadow-subtle"
                  style={{
                    width: '100%',
                    height: '400px',
                    background: i % 2 === 0 ? 'hsl(var(--primary-h), 80%, 98%)' : 'hsl(var(--accent-h), 80%, 98%)',
                    borderRadius: i % 2 === 0 ? '40px 100px 40px 40px' : '100px 40px 40px 40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '120px',
                    border: '1px solid var(--border-light)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '150px', height: '150px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                  {feature.icon}
                </div>
              </div>

              {/* Text Side */}
              <div style={{ direction: 'ltr', padding: 'var(--space-8)' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  background: 'var(--charcoal)', 
                  color: '#fff', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '24px', 
                  marginBottom: 'var(--space-6)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: '32px', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '18px', maxWidth: '500px' }}>{feature.desc}</p>
                <ul style={{ listStyle: 'none', marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Industry Standard Tools', 'Live Feedback Loop', 'Production Ready Code'].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                      <span style={{ color: 'var(--success)' }}>✔</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
