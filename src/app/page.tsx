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
    <div style={{ minHeight: '100vh', background: '#fff', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Navbar />
      
      <main>
        {/* Phase 1: High Impact Entry */}
        <Hero />
        
        <TrustedBy />

        {/* Phase 2: Value Discovery */}
        <Features />

        {/* Phase 3: Authority & Numbers */}
        <StatsSection />

        {/* Phase 4: Differentiation */}
        <Comparison />

        {/* Phase 5: Education Product */}
        <Courses />

        {/* Phase 6: Social Proof */}
        <Testimonials />

        {/* Phase 7: Conversion */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
