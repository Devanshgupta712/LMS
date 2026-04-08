'use client';

import Link from 'next/link';

import { useTheme } from '../ThemeProvider';

export default function Hero() {
  return (
    <section style={{ 
      position: 'relative', 
      padding: '160px 0 100px', 
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      <div className="container-wide" style={{ 
        maxWidth: '1280px', 
        padding: '0 40px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
        gap: '60px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Content */}
        <div>
          <h1 style={{ 
            fontSize: 'clamp(48px, 6vw, 84px)', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: '32px', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em'
          }}>
            The Future of <span style={{ 
              background: 'linear-gradient(to right, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>IT Training</span> <br />
            is Real Experience.
          </h1>

          <p style={{ 
            fontSize: '20px', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.6, 
            marginBottom: '48px', 
            maxWidth: '560px',
            fontWeight: 500
          }}>
            Graduate with a 6-month experience certificate that top tech firms love. 
            Join 70k+ students hacking their way into the industry.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary" style={{ 
              borderRadius: '10px', 
              padding: '18px 44px', 
              fontSize: '17px',
              fontWeight: 700,
              background: 'var(--primary)',
              color: '#fff'
            }}>
              Enroll For Free
            </Link>
            <Link href="/courses" style={{ 
              borderRadius: '10px', 
              padding: '18px 44px', 
              fontSize: '17px',
              border: '1px solid var(--border)',
              background: '#fff',
              color: 'var(--text-primary)',
              fontWeight: 700,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Explore Courses
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div style={{ position: 'relative' }} className="desktop-only">
          <div style={{ 
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: 'var(--shadow-premium)',
            background: '#fff'
          }}>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80" 
              alt="MNC Training" 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          
          {/* Floating 'Results' Badge */}
          <div style={{
            position: 'absolute',
            top: '40px',
            right: '-30px',
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 2
          }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '10px', 
              background: 'rgba(255,255,255,0.2)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>14L+</div>
              <div style={{ fontSize: '11px', fontWeight: 500, opacity: 0.9 }}>Avg. Salary</div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 1024px) {
          .container-wide { grid-template-columns: 1fr !important; text-align: center; }
          .container-wide p { margin-left: auto; margin-right: auto; }
          .container-wide div:first-child { display: flex; flexDirection: column; alignItems: center; }
          .desktop-only { display: none !important; }
        }
      `}</style>
    </section>
  );
}
