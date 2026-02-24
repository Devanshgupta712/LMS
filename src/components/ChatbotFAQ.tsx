'use client';

import { useState } from 'react';

const FAQS = [
    {
        q: "How do I check my schedule?",
        a: "Navigate to the 'My Courses' or 'Batches' tab on the sidebar. Your schedule is detailed under each active batch."
    },
    {
        q: "How do I apply for leave?",
        a: "If you're a student or trainer, go to the 'Leaves / Attendance' section to submit a leave request for approval."
    },
    {
        q: "Who do I contact for support?",
        a: "You can reach out to the Admin team via the internal messaging system or email support@apptechcareers.com."
    },
    {
        q: "Where can I see available jobs?",
        a: "Students can browse active placement opportunities under the 'Placement Jobs' section in the sidebar."
    }
];

export default function ChatbotFAQ() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

    return (
        <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 90 }}>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: '0',
                    width: '350px',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg), 0 0 40px rgba(99, 102, 241, 0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.2s ease-out',
                }}>
                    <div style={{
                        background: 'var(--gradient-primary)',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>🤖</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Apptech Assistant</h3>
                                <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Online • Ready to help</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                            <div style={{ fontSize: '24px' }}>🤖</div>
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                borderTopLeftRadius: '2px',
                                fontSize: '13px',
                                color: 'var(--text-primary)',
                                maxWidth: '85%',
                                lineHeight: '1.5'
                            }}>
                                Hi there! I'm the Apptech support bot. Here are some commonly asked questions:
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '36px' }}>
                            {FAQS.map((faq, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedFaq(selectedFaq === idx ? null : idx)}
                                    style={{
                                        background: selectedFaq === idx ? 'var(--primary-glow)' : 'transparent',
                                        border: `1px solid ${selectedFaq === idx ? 'var(--primary)' : 'var(--border)'}`,
                                        color: selectedFaq === idx ? 'var(--primary-light)' : 'var(--text-secondary)',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        transition: 'all 0.2s',
                                        lineHeight: '1.4'
                                    }}
                                >
                                    {faq.q}
                                </button>
                            ))}
                        </div>

                        {selectedFaq !== null && (
                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                                <div style={{ fontSize: '24px' }}>🤖</div>
                                <div style={{
                                    background: 'var(--gradient-card)',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    borderTopLeftRadius: '2px',
                                    fontSize: '13px',
                                    color: 'var(--text-primary)',
                                    maxWidth: '85%',
                                    lineHeight: '1.5',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    {FAQS[selectedFaq].a}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: isOpen ? 'scale(0.9)' : 'scale(1)',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.6), 0 0 0 1px rgba(255,255,255,0.2)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)';
                }}
            >
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
}
