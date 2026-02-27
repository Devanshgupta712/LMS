'use client';

import Link from 'next/link';
import { getStoredUser } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function LandingWebsite() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a2e', fontFamily: 'var(--font-family)', overflowX: 'hidden' }}>

      {/* Top Navigation */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0', padding: '16px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src="/logo.png" alt="AppTechno" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /><span style={{ fontSize: 'clamp(16px, 4vw, 24px)', background: 'linear-gradient(135deg, #0066ff, #3399ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>AppTechno Software</span></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px', fontWeight: 500, flexWrap: 'wrap' }}>
            <a href="#courses" style={{ color: '#a1a1aa', textDecoration: 'none', transition: 'color 0.2s', display: 'none' }} className="nav-link-desktop">Courses</a>
            <a href="#placements" style={{ color: '#a1a1aa', textDecoration: 'none', transition: 'color 0.2s', display: 'none' }} className="nav-link-desktop">Placements</a>
            <a href="#about" style={{ color: '#a1a1aa', textDecoration: 'none', transition: 'color 0.2s', display: 'none' }} className="nav-link-desktop">About Us</a>

            {isLoggedIn ? (
              <Link href="/dashboard" style={{
                background: 'rgba(0,102,255,0.05)', border: '1px solid #0066ff',
                padding: '8px 20px', borderRadius: '24px', color: '#0066ff', textDecoration: 'none',
                transition: 'all 0.2s', fontSize: '13px'
              }}>
                Go to Dashboard
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/login" style={{
                  color: '#1a1a2e', textDecoration: 'none', padding: '8px 14px', fontSize: '13px'
                }}>Log in</Link>
                <Link href="/register" style={{
                  background: 'linear-gradient(135deg, #0044cc, #0066ff)',
                  padding: '8px 20px', borderRadius: '24px', color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0, 68, 204, 0.3)', fontWeight: 600, fontSize: '13px'
                }}>Apply Now</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: 'clamp(100px, 20vw, 160px) 16px clamp(60px, 10vw, 100px)', display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', position: 'relative'
      }}>
        {/* Decorative Orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: 'rgba(0, 68, 204, 0.15)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: '400px', height: '400px', background: 'rgba(237, 170, 30, 0.10)', borderRadius: '50%', filter: 'blur(100px)' }} />

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'inline-block', padding: '6px 16px', background: 'rgba(0, 68, 204, 0.1)',
            border: '1px solid rgba(0, 68, 204, 0.2)', borderRadius: '30px', color: '#3399ff',
            fontSize: '13px', fontWeight: 600, marginBottom: '24px', letterSpacing: '0.05em'
          }}>
            AI INSIDE. INNOVATION OUTSIDE.
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em', color: '#1a1a2e' }}>
            IT Training from <br /> <span style={{ background: 'linear-gradient(90deg, #0066ff, #ffb800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Real Software Companies.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 3vw, 20px)', color: '#555770', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', padding: '0 8px' }}>
            Get trained & certified by IT companies, work on live projects, earn a 6-months experience certificate, and get placed with AI-powered placement support.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="#courses" style={{
              background: '#0066ff', color: '#ffffff', padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 32px)', borderRadius: '30px',
              fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 700, textDecoration: 'none', transition: 'transform 0.2s',
              boxShadow: '0 4px 16px rgba(0,102,255,0.3)'
            }}>
              Explore Courses
            </Link>
            <Link href="/register" style={{
              background: '#ffffff', color: '#1a1a2e', padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 32px)', borderRadius: '30px',
              fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 600, textDecoration: 'none', border: '1px solid #e2e8f0',
              transition: 'background 0.2s'
            }}>
              Apply as Student
            </Link>
          </div>
        </div>

        {/* Dashboard Preview Image/Mockup area */}
        <div style={{
          marginTop: '80px', width: '100%', maxWidth: '1000px', height: '400px',
          background: 'linear-gradient(180deg, #f5f7fa, #eef1f6)', border: '1px solid #e2e8f0',
          borderRadius: '24px 24px 0 0', position: 'relative', borderBottom: 'none',
          boxShadow: '0 -10px 30px rgba(0,102,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,102,255,0.3), transparent)' }}></div>
          <p style={{ color: '#c1c9d6', fontSize: '24px', fontWeight: 800 }}>Interactive Learning Environment</p>
        </div>
      </section>

      {/* Features / Offerings Section */}
      <section id="courses" style={{ padding: '100px 24px', background: '#f5f7fa', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, marginBottom: '16px', color: '#1a1a2e' }}>Industry-Ready Programs</h2>
            <p style={{ color: '#555770', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>Hands-on curriculum designed by IT companies — learn, build, and get hired.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
            {[
              { icon: '💻', title: 'Full Stack Java Development', desc: 'Learn Java, Spring Boot, Angular to build enterprise-grade applications with project training from IT companies.', color: '#0066ff' },
              { icon: '🔥', title: 'Full Stack Python Development', desc: 'Master Python, Django, React for full stack web development with 6-months experience certificate.', color: '#ffb800' },
              { icon: '🧪', title: 'Software Testing & Automation', desc: 'Train in Manual, Selenium & API Testing for QA careers with live project experience.', color: '#10b981' },
              { icon: '🚀', title: 'MERN Stack Development', desc: 'Build modern apps with MongoDB, Express, React, Node.js — end-to-end JavaScript skills.', color: '#06b6d4' },
              { icon: '📈', title: 'Data Analytics', desc: 'Learn SQL, Power BI, Python to analyze and visualize data with professional dashboard creation.', color: '#f59e0b' },
              { icon: '🧠', title: 'Data Science', desc: 'Gain skills in machine learning, data modeling and advanced analytics for the AI-powered future.', color: '#3399ff' }
            ].map((course, i) => (
              <div key={i} style={{
                background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: '24px', padding: '40px', transition: 'transform 0.3s, border 0.3s, box-shadow 0.3s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = course.color; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>{course.icon}</div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#1a1a2e' }}>{course.title}</h3>
                <p style={{ color: '#555770', lineHeight: 1.6 }}>{course.desc}</p>
                <div style={{ marginTop: '32px' }}>
                  <Link href="/register" style={{ color: course.color, fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>View Syllabus & Apply →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '100px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#ffb800', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', marginBottom: '16px' }}>OUR MISSION</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, marginBottom: '32px', lineHeight: 1.2, color: '#1a1a2e' }}>Training the next generation of IT professionals.</h2>
          <p style={{ color: '#555770', fontSize: 'clamp(16px, 3vw, 20px)', lineHeight: 1.6, marginBottom: '40px' }}>
            AppTechno Careers BTM branch started in the year 2000 has trained more than 70,000 students through various courses & placed every student in reputed MNC&apos;s. We are the only training center in Bangalore that has 20+ years of Training & Placement Legacy. We have partnered with IT companies of India and US to train you and develop you to the needs of the IT industry.
          </p>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
            alt="Students collaborating"
            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '24px', border: '1px solid #e2e8f0' }}
          />
        </div>
      </section>

      {/* Placements Section */}
      <section id="placements" style={{ padding: '120px 24px', backgroundColor: '#ffffff', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 68, 204, 0.05) 0%, transparent 60%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 'clamp(32px, 5vw, 80px)', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', marginBottom: '16px' }}>CAREER SUPPORT</div>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: '24px', lineHeight: 1.2 }}>Unlimited Interviews until Placement.</h2>
              <p style={{ color: '#555770', fontSize: 'clamp(15px, 2.5vw, 18px)', lineHeight: 1.6, marginBottom: '32px' }}>
                AI-powered placement support with 6-months experience certificate. Pay 50% fees after placement. We provide 1-on-1 interview prep, resume reviews, and portfolio building along with AI English Communication Coach.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e' }}>70,000+</div>
                  <div style={{ color: '#8e8ea0', fontSize: '14px', fontWeight: 500 }}>Students Trained</div>
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e' }}>14 LPA</div>
                  <div style={{ color: '#8e8ea0', fontSize: '14px', fontWeight: 500 }}>Average Package</div>
                </div>
              </div>
            </div>
            <div style={{ background: '#f5f7fa', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '40px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'center', color: '#1a1a2e' }}>Where our alumni work</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {['Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 'Uber'].map((company, i) => (
                  <div key={i} style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#555770', fontWeight: 600, fontSize: '18px', border: '1px solid #e2e8f0' }}>
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#f5f7fa', borderTop: '1px solid #e2e8f0', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>AppTechno Software</div>
            <div style={{ color: '#71717a', fontSize: '14px' }}>AI Inside. Innovation Outside. Since 2000.</div>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#a1a1aa', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#" style={{ cursor: 'pointer', color: '#a1a1aa', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ cursor: 'pointer', color: '#a1a1aa', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ cursor: 'pointer', color: '#a1a1aa', textDecoration: 'none' }}>Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
