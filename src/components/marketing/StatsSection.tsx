'use client';

import { useEffect, useState, useRef } from 'react';

const StatCounter = ({ end, label, suffix = '', duration = 2000 }: { end: number, label: string, suffix?: string, duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const increment = end / (duration / 16);
    const counter = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [isVisible, end, duration]);

  return (
    <div ref={countRef} style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ 
        fontSize: 'clamp(48px, 5vw, 64px)', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        letterSpacing: '-0.04em',
        marginBottom: '8px',
        fontFamily: 'var(--font-heading)'
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 700, 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em' 
      }}>
        {label}
      </div>
    </div>
  );
};

export default function StatsSection() {
  return (
    <section style={{ 
      padding: '100px 0', 
      background: '#fff',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="container-wide" style={{ 
        maxWidth: '1280px', 
        padding: '0 40px',
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '40px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>70k+</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '12px' }}>Students Trained</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)' }}>
          <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>14L+</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '12px' }}>Avg. Salary Package</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)' }}>
          <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>500+</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '12px' }}>Partner MNCs</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)' }}>
          <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>100%</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '12px' }}>Placement Record</div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 60px !important;
          }
          div[style*="borderLeft: 1px solid var(--border)"] {
            border-left: none !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
