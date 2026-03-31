import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../ThemeProvider';
import { getStoredUser } from '@/lib/api';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    if (getStoredUser()) {
      setIsLoggedIn(true);
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Courses', href: '/courses' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav 
      style={{ 
        position: 'fixed', 
        top: isScrolled ? '12px' : '0', 
        left: '50%', 
        transform: 'translateX(-50%)',
        width: isScrolled ? 'calc(100% - 40px)' : '100%', 
        maxWidth: isScrolled ? '1200px' : '100%',
        zIndex: 1000, 
        padding: isScrolled ? '12px 24px' : '24px 40px', 
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        background: isScrolled ? 'var(--bg-card)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderRadius: isScrolled ? '24px' : '0',
        border: isScrolled ? '1px solid var(--border)' : 'none',
        boxShadow: isScrolled ? 'var(--shadow-premium)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Logo */}
        <Link href="/" style={{ 
          fontSize: '20px', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none'
        }}>
          <img src="/logo.png" alt="AppTechno Software Logo" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
          <span style={{ lineHeight: 1 }}>AppTechno <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Software</span></span>
        </Link>

        {/* Links (Desktop) */}
        <div className="desktop-only" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--text-secondary)',
                letterSpacing: '-0.01em',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {link.name}
            </Link>
          ))}
          
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }}></div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: 'none', 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.3s'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary shadow-premium hover-lift" style={{ 
              borderRadius: '12px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'var(--primary)',
              color: '#fff'
            }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                marginRight: '8px'
              }}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary shadow-premium hover-lift" style={{ 
                borderRadius: '12px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                background: 'var(--primary)',
                color: '#fff'
              }}>
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="mobile-only" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ 
            background: 'var(--bg-tertiary)', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px'
          }}
        >
          <span style={{ fontSize: '20px' }}>{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 'var(--space-4)',
          right: 'var(--space-4)',
          background: 'var(--bg-primary)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-10)',
          gap: '24px',
          borderRadius: '24px',
          marginTop: '12px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)'
        }}>
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {link.name}
            </Link>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          {isLoggedIn ? (
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-lg" style={{ borderRadius: '16px' }}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '20px', fontWeight: 600 }}>Login</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-lg" style={{ borderRadius: '16px', fontWeight: 600 }}>Enroll For Free</Link>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
