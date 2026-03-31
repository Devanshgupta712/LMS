'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press', href: '/press' },
    ],
    Learning: [
      { name: 'All Courses', href: '/courses' },
      { name: 'Tutorials', href: '/tutorials' },
      { name: 'Certification', href: '/certifications' },
      { name: 'Student Portal', href: '/dashboard' },
    ],
    Support: [
      { name: 'Contact', href: '/contact' },
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Privacy', href: '/privacy' },
    ],
  };

  return (
    <footer style={{ background: 'var(--bg-secondary)', padding: '80px 24px 40px', borderTop: '1px solid var(--border)' }}>
      <div className="container-wide" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '80px' }}>
          {/* Logo & Info */}
          <div style={{ flex: '1.5' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <img src="/logo.png" alt="AppTechno Software" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              <span style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)' }}>AppTechno <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Software</span></span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px', maxWidth: '300px' }}>
              Realizing your IT dreams since 2000. We bridge the gap between classroom and boardroom.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Simple icon placeholders */}
              {['𝕏', 'in', 'f', 'ig'].map((icon, i) => (
                <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary)')} onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>{title}</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {links.map((link) => (
                  <li key={link.name} style={{ marginBottom: '12px' }}>
                    <Link href={link.href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', fontSize: '14px' }} onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary)')} onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            © {currentYear} AppTechno Software Private Limited. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/cookies" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
