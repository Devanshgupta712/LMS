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
    <section style={{ padding: '100px 0', background: 'var(--bg-primary)' }}>
      <div className="container-wide" style={{ 
        maxWidth: '1100px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '40px'
      }}>
        <StatCounter end={70000} label="Students Trained" suffix="+" />
        <StatCounter end={14} label="Avg. Package" suffix=" LPA" />
        <StatCounter end={500} label="Partner MNCs" suffix="+" />
        <StatCounter end={100} label="Placement Record" suffix="%" />
      </div>
    </section>
  );
}
