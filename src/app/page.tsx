'use client';

import Navbar from '@/components/marketing/Navbar';
import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import Courses from '@/components/marketing/Courses';
import CTA from '@/components/marketing/CTA';
import Footer from '@/components/marketing/Footer';
import TrustedBy from '@/components/marketing/TrustedBy';
import StatsSection from '@/components/marketing/StatsSection';
import Testimonials from '@/components/marketing/Testimonials';
import Comparison from '@/components/marketing/Comparison';
import { useEffect } from 'react';

export default function LandingWebsite() {
  // Use Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Navbar />
      
      <main>
        {/* Phase 1: High Impact Entry */}
        <Hero />
        
        <div className="reveal-on-scroll">
          <TrustedBy />
        </div>

        {/* Phase 2: Value Discovery */}
        <div className="reveal-on-scroll" style={{ background: 'var(--bg-secondary)', padding: '100px 0' }}>
          <Features />
        </div>

        {/* Phase 3: Authority & Numbers */}
        <div className="reveal-on-scroll">
          <StatsSection />
        </div>

        {/* Phase 4: Differentiation */}
        <div className="reveal-on-scroll" style={{ background: 'var(--bg-secondary)', padding: '100px 0' }}>
          <Comparison />
        </div>

        {/* Phase 5: Education Product */}
        <div className="reveal-on-scroll" style={{ padding: '100px 0' }}>
          <Courses />
        </div>

        {/* Phase 6: Social Proof */}
        <div className="reveal-on-scroll" style={{ background: 'var(--bg-secondary)', padding: '100px 0' }}>
          <Testimonials />
        </div>

        {/* Phase 7: Conversion */}
        <div className="reveal-on-scroll">
          <CTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}
