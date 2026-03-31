'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const fallbackCourses = [
  { id: 1, title: 'Full Stack Java', category: 'Backend', icon: '💻', price: '₹49,999', rating: '4.9/5' },
  { id: 2, title: 'Python Django React', category: 'Full Stack', icon: '🔥', price: '₹54,999', rating: '5.0/5' },
  { id: 3, title: 'Data Analytics', category: 'Data Science', icon: '📊', price: '₹59,999', rating: '4.8/5' },
  { id: 4, title: 'MERN Stack', category: 'Web Dev', icon: '🚀', price: '₹52,999', rating: '4.9/5' },
];

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/public/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayCourses = courses.length > 0 ? courses : fallbackCourses;

  return (
    <section className="section-padding bg-tertiary" style={{ padding: 'var(--space-32) 0', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Text background */}
      <div style={{ 
        position: 'absolute', 
        top: '10%', 
        right: '-5%', 
        fontSize: '20vw', 
        fontWeight: 900, 
        color: 'rgba(0,0,0,0.02)', 
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        lineHeight: 1
      }}>
        LEARN
      </div>

      <div className="container-wide" style={{ maxWidth: '1280px', padding: '0 var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-20)', position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.2em', marginBottom: 'var(--space-4)', textTransform: 'uppercase' }}>CURRICULUM</div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Master the Stack.</h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '500px', marginTop: 'var(--space-4)' }}>
            Choose from our specialized career tracks. Each one is a 6-month intensive journey.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
          gap: 'var(--space-10)',
          alignItems: 'start'
        }}>
          {displayCourses.map((course, i) => (
            <div 
              key={course.id}
              className="hover-lift reveal-on-scroll"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--border-radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                transform: `translateY(${i % 2 === 1 ? 'var(--space-16)' : '0'})`,
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}
            >
              <div style={{ 
                background: i % 2 === 0 ? 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)' : 'linear-gradient(135deg, var(--primary), var(--accent))', 
                height: '240px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '80px',
                color: '#fff',
                position: 'relative'
              }}>
                <span className="float-slow">{course.icon}</span>
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                  {course.category}
                </div>
              </div>
              <div style={{ padding: 'var(--space-10)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>⭐ {course.rating} / 5.0</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>6 Months</div>
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-6)', color: 'var(--text-primary)', lineHeight: 1.1 }}>{course.title}</h3>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Program Fee</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{course.price}</div>
                  </div>
                  <Link href="/register" className="btn btn-primary hover-lift" style={{ borderRadius: '12px', padding: '12px 24px' }}>
                    Enroll Now
                  </Link>
                </div>
              </div>

              {/* Decorative Corner */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: '60px', 
                height: '60px', 
                background: 'rgba(255,255,255,0.1)', 
                clipPath: 'polygon(100% 0, 0 0, 100% 100%)' 
              }}></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Spacer for staggered grid bottom */}
      <div style={{ height: 'var(--space-20)' }}></div>
    </section>
  );
}
