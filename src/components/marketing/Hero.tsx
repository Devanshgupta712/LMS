'use client';

import Link from 'next/link';

import { useTheme } from '../ThemeProvider';

export default function Hero() {
  const { theme } = useTheme();

  return (
    <section className="mesh-gradient noise-overlay" style={{ 
      position: 'relative', 
      padding: 'clamp(140px, 20vh, 240px) 0 clamp(80px, 10vh, 120px)', 
      overflow: 'hidden',
      background: theme === 'dark' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
      transition: 'background 0.8s ease'
    }}>
      {/* Stripe-style Animated Atmospheric Glows */}
      <div style={{ 
        position: 'absolute', 
        top: '-10%', 
        left: '20%', 
        width: '60%', 
        height: '60%', 
        background: 'radial-gradient(circle, hsla(var(--primary-h), 80%, 60%, 0.12) 0%, transparent 70%)',
        filter: 'blur(120px)',
        animation: 'float-glow 15s infinite alternate',
        zIndex: 0
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '-10%', 
        right: '10%', 
        width: '50%', 
        height: '50%', 
        background: 'radial-gradient(circle, hsla(var(--accent-h), 80%, 60%, 0.08) 0%, transparent 70%)',
        filter: 'blur(120px)',
        animation: 'float-glow 18s infinite alternate-reverse',
        zIndex: 0
      }} />

      <div className="container-wide" style={{ 
        maxWidth: '1280px', 
        padding: '0 var(--space-8)',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '40px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Content */}
        <div style={{ textAlign: 'left' }}>
          <div 
            className="animate-slide-right"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              background: 'hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--primary)',
              marginBottom: '32px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span style={{ fontSize: '16px' }}>✨</span> Trusted by 100+ Top MNCs
          </div>

          <h1 
            className="animate-slide-up"
            style={{ 
              fontSize: 'clamp(52px, 7vw, 92px)', 
              fontWeight: 800, 
              lineHeight: 1.05, 
              marginBottom: '32px', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em'
            }}
          >
            The Future <br /> 
            <span style={{ 
              background: 'linear-gradient(to right, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              of IT Training
            </span> <br />
            is Real Experience.
          </h1>

          <p 
            className="animate-fade-in"
            style={{ 
              fontSize: '20px', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.6, 
              marginBottom: '48px', 
              maxWidth: '600px',
              fontWeight: 500
            }}
          >
            Graduate with a **6-month experience certificate** that top tech firms love. 
            Join 70k+ students hacking their way into the industry.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary shadow-premium hover-lift" style={{ 
              borderRadius: '14px', 
              padding: '22px 52px', 
              fontSize: '18px',
              fontWeight: 600,
              background: 'var(--primary)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              Enroll For Free
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'stripe-flow 3s linear infinite' }}></div>
            </Link>
            <Link href="/courses" className="btn hover-lift" style={{ 
              borderRadius: '14px', 
              padding: '20px 48px', 
              fontSize: '18px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}>
              Explore Courses
            </Link>
          </div>
        </div>

        {/* Right Content — Premium Visual */}
        <div style={{ position: 'relative' }} className="desktop-only animate-scale-in">
          <div className="glass-premium" style={{ 
            borderRadius: '32px', 
            overflow: 'hidden', 
            padding: '12px',
            background: 'var(--bg-card)',
            transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)'
          }}>
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1000&q=80" 
              alt="MNC Training" 
              style={{ borderRadius: '24px', width: '100%', height: 'auto', boxShadow: 'var(--shadow-lg)' }}
            />
          </div>
          
          {/* Floating 'Results' Badge */}
          <div className="glass-premium float-slow" style={{
            position: 'absolute',
            bottom: '40px',
            left: '-40px',
            padding: '24px',
            borderRadius: '24px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>📈</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>14L+</div>
              <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.8 }}>Avg. Salary Package</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
