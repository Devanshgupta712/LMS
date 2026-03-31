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
        <section className="section-padding" style={{ paddingTop: 'clamp(120px, 15vh, 180px)', background: 'var(--bg-secondary)', paddingBottom: 'var(--space-12)' }}>
          <div className="container-wide" style={{ maxWidth: '1000px', textAlign: 'center', padding: '0 var(--space-8)' }}>
            <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 700, marginBottom: 'var(--space-6)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>We're Here to Help.</h1>
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto' }}>
              Have questions about our programs, fees, or placements? Our team of career experts is ready to guide you.
            </p>
          </div>
        </section>

        {/* Contact Grid Section */}
        <section className="section-padding" style={{ padding: 'var(--space-20) 0' }}>
          <div className="container-wide" style={{ maxWidth: '1200px', padding: '0 var(--space-8)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px' }}>
              {/* Contact Form */}
              <div className="hover-glow" style={{ 
                padding: 'var(--space-10)', 
                borderRadius: 'var(--border-radius-lg)', 
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: 'var(--space-8)', letterSpacing: '-0.02em' }}>Send Us a Message</h2>
                <form 
                  onSubmit={(e) => { e.preventDefault(); alert('Message sent! (Mock implementation)'); }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>First Name</label>
                      <input type="text" placeholder="John" className="form-input" style={{ width: '100%', borderRadius: '12px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Last Name</label>
                      <input type="text" placeholder="Doe" className="form-input" style={{ width: '100%', borderRadius: '12px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                    <input type="email" placeholder="john@example.com" className="form-input" style={{ width: '100%', borderRadius: '12px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Phone Number</label>
                    <input type="tel" placeholder="+91 9876543210" className="form-input" style={{ width: '100%', borderRadius: '12px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Your Message</label>
                    <textarea placeholder="How can we help you?" className="form-textarea" style={{ width: '100%', minHeight: '120px', borderRadius: '12px' }}></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg hover-lift shadow-md" style={{ marginTop: 'var(--space-4)', borderRadius: '12px', width: '100%' }}>Send Message</button>
                </form>
              </div>

              {/* Contact Info & Map */}
              <div>
                <div style={{ marginBottom: 'var(--space-12)' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: 'var(--space-8)', letterSpacing: '-0.02em' }}>Visit Our Campus</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ width: '56px', height: '56px', background: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📍</div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>AppTechno Software</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>123, BTM Layout 2nd Stage,<br />Bangalore, KA 560076 India</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ width: '56px', height: '56px', background: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📞</div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Call Us</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>+91 12345 67890<br />Mon-Sat: 10:00 AM - 7:00 PM</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ width: '56px', height: '56px', background: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>✉️</div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Email Us</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>info@apptechno.com<br />support@apptechno.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mock Map Placeholder */}
                <div className="hover-lift" style={{ 
                  width: '100%', 
                  height: '240px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--text-muted)', 
                  fontWeight: 600, 
                  border: '1px solid var(--border)' 
                }}>
                  Interactive Map Component
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
