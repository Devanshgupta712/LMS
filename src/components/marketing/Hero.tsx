'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero-section" style={{ 
      position: 'relative', 
      overflow: 'hidden',
      padding: '120px 0 100px',
      background: 'var(--bg-primary)'
    }}>
      <div className="hero-container">
        {/* Left Content */}
        <div className="hero-content">
          <h1 style={{ 
            fontSize: 'clamp(36px, 6vw, 84px)', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: '32px', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em'
          }}>
            The Future of{' '}
            <span style={{ 
              background: 'linear-gradient(to right, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>IT Training</span>{' '}
            is Real Experience.
          </h1>

          <p style={{ 
            fontSize: 'clamp(15px, 2vw, 20px)', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.6, 
            marginBottom: '48px', 
            maxWidth: '560px',
            fontWeight: 500
          }}>
            Graduate with a 6-month experience certificate that top tech firms love.{' '}
            Join 70k+ students hacking their way into the industry.
          </p>

          <div className="hero-btns">
            <Link href="/register" className="btn btn-primary" style={{ 
              borderRadius: '10px', 
              padding: '16px 36px', 
              fontSize: '17px',
              fontWeight: 700,
              background: 'var(--primary)',
              color: '#fff'
            }}>
              Enroll For Free
            </Link>
            <Link href="/courses" className="hero-secondary-btn" style={{ 
              borderRadius: '10px', 
              padding: '16px 36px', 
              fontSize: '17px',
              border: '1px solid var(--border)',
              background: '#fff',
              color: 'var(--text-primary)',
              fontWeight: 700,
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}>
              Explore Courses
            </Link>
          </div>
        </div>

        {/* Right Content — hidden on mobile via CSS */}
        <div className="hero-image-col" style={{ position: 'relative' }}>
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
          
          {/* Floating Badge */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>14L+</div>
              <div style={{ fontSize: '11px', fontWeight: 500, opacity: 0.9 }}>Avg. Salary</div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ⚠️ styled-jsx (<style jsx>) is NOT supported in Next.js App Router. 
        Use a plain <style> tag instead.
      */}
      <style>{`
        .hero-section {
          padding: 140px 0 100px;
        }
        .hero-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .hero-btns {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 1024px) {
          .hero-section {
            padding: 100px 0 60px;
          }
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 0 20px;
            gap: 40px;
          }
          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-content p {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-btns {
            justify-content: center;
          }
          .hero-image-col {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
