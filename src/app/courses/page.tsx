'use client';

import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import Courses from '@/components/marketing/Courses';
import CTA from '@/components/marketing/CTA';

import { useState } from 'react';

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Courses');
  const allCategories = ['All Courses', 'Backend', 'Frontend', 'Data Science', 'Testing', 'Full Stack'];
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }} className="bg-grid-subtle">
      <Navbar />
      
      <main>
        {/* Header Section */}
        <section className="section-padding" style={{ paddingTop: 'clamp(80px, 10vh, 120px)', paddingBottom: 'var(--space-6)' }}>
          <div className="container-wide" style={{ maxWidth: '1200px', textAlign: 'center', padding: '0 var(--space-8)' }}>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, marginBottom: 'var(--space-4)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>Pick Your Career Pathway.</h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto var(--space-8)' }}>
              From Full Stack Web Development to Data Science, choose the program that aligns with your goals.
            </p>
            
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap', padding: 'var(--space-4) 0' }}>
              {allCategories.map((cat, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedCategory(cat)}
                  className="hover-lift" 
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: '100px', 
                    border: '1px solid', 
                    borderColor: selectedCategory === cat ? 'var(--primary)' : 'var(--border)', 
                    background: selectedCategory === cat ? 'var(--primary)' : '#fff', 
                    color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)', 
                    fontWeight: 700, 
                    fontSize: '13px', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s', 
                    boxShadow: selectedCategory === cat ? 'var(--shadow-md)' : 'var(--shadow-sm)' 
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <Courses activeCategory={selectedCategory} />

        <div className="section-divider"></div>

        {/* Benefits for Students Section */}
        <section className="section-padding" style={{ background: 'var(--bg-secondary)', padding: 'var(--space-20) 0' }}>
          <div className="container-wide" style={{ maxWidth: '1200px', padding: '0 var(--space-8)' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', marginBottom: 'var(--space-16)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>What You Get With Each Course</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-8)' }}>
              {[
                { title: 'Certification', desc: 'Industry-recognized certificate from AppTechno Software.', icon: '📜' },
                { title: 'Project Training', desc: 'Work on 3+ live projects with source code and deployment.', icon: '💻' },
                { title: 'Job Placement', desc: 'Guaranteed 10+ interview calls from top IT companies.', icon: '🤝' },
                { title: 'Mentor Support', desc: '1-on-1 doubt clearing sessions with senior developers.', icon: '👨‍🏫' }
              ].map((benefit, i) => (
                <div key={i} className="hover-lift hover-glow" style={{ 
                  padding: 'var(--space-10)', 
                  borderRadius: 'var(--border-radius-lg)', 
                  textAlign: 'center',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: 'var(--space-6)' }}>{benefit.icon}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 750, marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>{benefit.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{benefit.desc}</p>
                </div>
              ))}
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
