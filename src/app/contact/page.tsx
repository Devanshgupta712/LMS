'use client';

import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import CTA from '@/components/marketing/CTA';

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }} className="bg-grid-subtle">
      <Navbar />
      
      <main>
        {/* Header Section */}
        <section className="section-padding" style={{ paddingTop: 'clamp(80px, 10vh, 120px)', background: 'var(--bg-secondary)', paddingBottom: 'var(--space-8)' }}>
          <div className="container-wide" style={{ maxWidth: '1000px', textAlign: 'center', padding: '0 var(--space-8)' }}>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, marginBottom: 'var(--space-4)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>We're Here to Help.</h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
              Have questions about our programs, fees, or placements? Our team of career experts is ready to guide you.
            </p>
          </div>
        </section>

        {/* Contact Grid Section */}
        <section className="section-padding" style={{ padding: 'var(--space-16) 0' }}>
          <div className="container-wide" style={{ maxWidth: '1100px', padding: '0 var(--space-8)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px' }}>
              {/* Contact Form */}
              <div className="glass-premium" style={{ 
                padding: 'var(--space-10)', 
                borderRadius: 'var(--border-radius-lg)', 
                border: '1px solid var(--border)',
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>Send Us a Message</h2>
                <form 
                  onSubmit={(e) => { e.preventDefault(); alert('Message sent! (Mock implementation)'); }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>First Name</label>
                      <input type="text" placeholder="John" className="form-input" style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Last Name</label>
                      <input type="text" placeholder="Doe" className="form-input" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                    <input type="email" placeholder="john@example.com" className="form-input" style={{ width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Phone Number</label>
                    <input type="tel" placeholder="+91 9876543210" className="form-input" style={{ width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Your Message</label>
                    <textarea placeholder="How can we help you?" className="form-textarea" style={{ width: '100%', minHeight: '100px' }}></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg hover-lift shadow-md" style={{ marginTop: 'var(--space-2)', width: '100%' }}>Send Message</button>
                </form>
              </div>

              {/* Contact Info & Map */}
              <div style={{ paddingTop: 'var(--space-4)' }}>
                <div style={{ marginBottom: 'var(--space-10)' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-8)', letterSpacing: '-0.02em' }}>Visit Our Campus</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>AppTechno Software</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>123, BTM Layout 2nd Stage,<br />Bangalore, KA 560076 India</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Call Us</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>+91 12345 67890<br />Mon-Sat: 10:00 AM - 7:00 PM</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Email Us</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>info@apptechno.com<br />support@apptechno.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mock Map Placeholder */}
                <div className="hover-lift" style={{ 
                  width: '100%', 
                  height: '200px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--text-muted)', 
                  fontSize: '14px',
                  fontWeight: 600, 
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div className="mesh-gradient" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}></div>
                  <span style={{ position: 'relative', zIndex: 1 }}>Interactive Map Component</span>
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
