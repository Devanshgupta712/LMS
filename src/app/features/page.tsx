'use client';

import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import Features from '@/components/marketing/Features';
import CTA from '@/components/marketing/CTA';

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }} className="bg-grid-subtle">
      <Navbar />
      
      <main>
        {/* Header Section */}
        <section className="section-padding" style={{ paddingTop: 'clamp(120px, 15vh, 180px)', background: 'var(--bg-secondary)', paddingBottom: 'var(--space-16)' }}>
          <div className="container-wide" style={{ maxWidth: '1000px', textAlign: 'center', padding: '0 var(--space-8)' }}>
            <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 700, marginBottom: 'var(--space-6)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>Everything You Need to Succeed.</h1>
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '800px', margin: '0 auto' }}>
              We've built a platform that not only teaches you how to code but also how the industry works. 
              Our features are designed to make you 'industry-ready' from day one.
            </p>
          </div>
        </section>

        <Features />

        <div className="section-divider"></div>

        {/* Highlight Section */}
        <section className="section-padding" style={{ background: 'var(--bg-primary)', padding: 'var(--space-20) 0' }}>
          <div className="container-wide" style={{ maxWidth: '1200px', padding: '0 var(--space-8)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '80px', alignItems: 'center' }}>
              <div className="hover-lift" style={{ position: 'relative' }}>
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" 
                  alt="Team collaboration" 
                  style={{ width: '100%', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }}
                />
                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', background: 'var(--primary)', color: '#fff', padding: '20px', borderRadius: '20px', boxShadow: 'var(--shadow-md)', fontWeight: 700 }}>
                  95% Placement Rate
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', marginBottom: 'var(--space-4)', textTransform: 'uppercase' }}>PLACEMENT ASSISTANCE</div>
                <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>AI-Powered Career Portal</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-8)', fontSize: '18px' }}>
                  Our proprietary AI tool analyzes your coding style, identifies your strengths, and matches you with the ideal companies in our network.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {['Personalized Resume Building', 'Mock Coding Interviews', 'Communication Coaching', 'Real-time Job Alerts'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                      <span style={{ 
                        width: '28px', 
                        height: '28px', 
                        background: 'var(--primary-glow)', 
                        color: 'var(--primary)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
