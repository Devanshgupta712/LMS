'use client';

import { useEffect, useRef } from 'react';

const features = [
  { 
    icon: '🏗️', 
    title: 'Live Project Experience', 
    desc: 'Experience on IT Training in project driven.',
    items: ['Live Project Experience', 'Live Project Experience', 'Live Project Experience']
  },
  { 
    icon: '🤖', 
    title: 'AI-Powered Support', 
    desc: 'Learn your AI-Admin and support around beginners.',
    items: ['AI-Powered Support', 'AI-Powered Support', 'AI-Powered Support']
  },
  { 
    icon: '📅', 
    title: 'Flexible Batches', 
    desc: 'Keep it video place w today context and for system.',
    items: ['Flexible Batches', 'Flexible Batches Batches', 'Flexible Batches']
  },
  { 
    icon: '🎓', 
    title: 'IT Company Certificate', 
    desc: 'Helps yes our customers certificate.',
    items: ['IT Company Certificate', 'IT Ready Certificate', 'IT Company Certificate']
  },
  { 
    icon: '🤝', 
    title: '50% Fees After Placement', 
    desc: 'Secure your business with placement yes.',
    items: ['50% Fees After Placement', '50% Fees After Placement', '50% Fees After Placement']
  },
  { 
    icon: '👨‍🏫', 
    title: 'Industry Experts', 
    desc: 'Meets new costs w industry experiences trop winnes.',
    items: ['Industry Experts', 'Industry Expertisements', 'Industry Experts']
  }
];

export default function Features() {
  return (
    <section style={{ padding: '100px 0', background: '#fff' }}>
      <div className="container-wide" style={{ maxWidth: '1280px', padding: '0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 800, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '40px'
          }}>
            The Difference: How AppTechno Prepares You for the Real World
          </h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '24px'
        }}>
          {features.map((feature, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: '#fff',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; 
                e.currentTarget.style.borderColor = 'var(--primary-glow)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.boxShadow = 'none'; 
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ fontSize: '32px' }}>{feature.icon}</div>
              
              <div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  marginBottom: '10px'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px',
                  lineHeight: 1.6,
                  marginBottom: '20px'
                }}>
                  {feature.desc}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {feature.items.map((item, idx) => (
                    <li key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontWeight: 500
                    }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '10px' }}>•</span> {item}
                    </li>
                  ))}
                </ul>
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
