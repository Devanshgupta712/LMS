'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    time: string;
}

// Knowledge base for AppTechno Software
const KNOWLEDGE_BASE: { keywords: string[]; response: string; priority: number }[] = [
    // Courses
    {
        keywords: ['course', 'courses', 'program', 'programs', 'curriculum', 'training', 'learn', 'study', 'offer'],
        response: "🎓 **AppTechno offers 6 industry-ready programs:**\n\n• **Full Stack Java Development** — Java, Spring Boot, Angular\n• **Full Stack Python Development** — Python, Django, React\n• **MERN Stack Development** — MongoDB, Express, React, Node.js\n• **Software Testing & Automation** — Manual, Selenium, API Testing\n• **Data Analytics** — SQL, Power BI, Python\n• **Data Science** — Machine Learning, Data Modeling, Advanced Analytics\n\nAll courses include live project training from real IT companies and a 6-month experience certificate!",
        priority: 10
    },
    {
        keywords: ['java', 'spring boot', 'angular'],
        response: "☕ **Full Stack Java Development** covers:\n• Core Java & Advanced Java\n• Spring Boot & Spring MVC\n• Angular for frontend\n• Hibernate & JPA\n• REST APIs & Microservices\n• Live project training with IT companies\n\nDuration: ~6 months with placement support. You'll get a 6-month experience certificate!",
        priority: 15
    },
    {
        keywords: ['python', 'django'],
        response: "🐍 **Full Stack Python Development** covers:\n• Python fundamentals & advanced concepts\n• Django framework\n• React for frontend\n• Database management (SQL & NoSQL)\n• REST API development\n• Live project training\n\nIncludes 6-month experience certificate and AI-powered placement support!",
        priority: 15
    },
    {
        keywords: ['mern', 'mongodb', 'express', 'react', 'node'],
        response: "🚀 **MERN Stack Development** covers:\n• MongoDB (NoSQL database)\n• Express.js (backend framework)\n• React.js (frontend library)\n• Node.js (runtime environment)\n• Full JavaScript stack\n• Live project experience\n\nLearn end-to-end JavaScript development with real company projects!",
        priority: 15
    },
    {
        keywords: ['testing', 'automation', 'selenium', 'qa', 'manual testing'],
        response: "🧪 **Software Testing & Automation** covers:\n• Manual Testing fundamentals\n• Selenium WebDriver\n• API Testing (Postman, RestAssured)\n• TestNG & Cucumber\n• Performance Testing basics\n• Live QA project experience\n\nGreat career path with high demand in the industry!",
        priority: 15
    },
    {
        keywords: ['data analytics', 'analytics', 'power bi', 'sql'],
        response: "📊 **Data Analytics** covers:\n• SQL & Advanced Queries\n• Python for data analysis\n• Power BI dashboards\n• Data visualization\n• Statistical analysis\n• Real business case studies\n\nPerfect for those who want to make data-driven decisions!",
        priority: 15
    },
    {
        keywords: ['data science', 'machine learning', 'ml', 'ai'],
        response: "🧠 **Data Science** covers:\n• Python for Data Science\n• Machine Learning algorithms\n• Deep Learning basics\n• Data modeling & feature engineering\n• Statistical analysis\n• Real-world data projects\n\nPrepare for the AI-powered future with hands-on ML experience!",
        priority: 15
    },

    // Fees & Payment
    {
        keywords: ['fee', 'fees', 'cost', 'price', 'payment', 'pay', 'afford', 'money', 'expensive', 'cheap'],
        response: "💰 **Fee Structure:**\n\nAppTechno offers a unique **Pay 50% After Placement** model!\n\n• You pay only partial fees upfront\n• Remaining 50% after you get placed\n• EMI options available\n• No hidden charges\n\nFor exact fee details for your chosen course, please contact our admissions team or visit the center.",
        priority: 10
    },

    // Placement
    {
        keywords: ['placement', 'job', 'jobs', 'career', 'hiring', 'placed', 'salary', 'package', 'interview', 'hire', 'employ', 'work'],
        response: "🚀 **Placement Support:**\n\n• **70,000+ students** trained & placed since 2000\n• **14 LPA** average package\n• **Unlimited interviews** until placed!\n• AI-powered placement support\n• 1-on-1 interview preparation\n• Resume reviews & portfolio building\n• AI English Communication Coach\n• 6-month experience certificate\n\nOur alumni work at Google, Amazon, Microsoft, Meta, Netflix, Uber & more!",
        priority: 10
    },

    // About
    {
        keywords: ['about', 'company', 'who', 'apptech', 'apptechno', 'history', 'legacy', 'year', 'established'],
        response: "🏢 **About AppTechno Software:**\n\n• Started in **2000** — 20+ years of legacy!\n• Based in **BTM Layout, Bangalore**\n• Trained **70,000+ students**\n• Only training center in Bangalore with 20+ years history\n• Partnered with IT companies in India & US\n• Real project training from software companies\n\n**Tagline:** AI Inside. Innovation Outside.",
        priority: 10
    },

    // Duration
    {
        keywords: ['duration', 'long', 'months', 'weeks', 'time', 'how long', 'length'],
        response: "⏱️ **Course Duration:**\n\nMost of our programs are approximately **4-6 months** in duration, which includes:\n\n• Classroom/Online training\n• Live project work with IT companies\n• Interview preparation\n• 6-month experience certificate period\n\nSchedules are flexible with both weekday and weekend batches available!",
        priority: 10
    },

    // Schedule & Batch
    {
        keywords: ['schedule', 'batch', 'timing', 'class', 'when', 'start', 'next batch', 'weekend', 'weekday'],
        response: "📅 **Batch Schedule:**\n\n• **Weekday batches** — Mon to Fri\n• **Weekend batches** — Sat & Sun\n• New batches start regularly\n• Check the dashboard for your assigned batch schedule\n\nFor the next batch start date, please contact the admissions team!",
        priority: 10
    },

    // Location
    {
        keywords: ['location', 'address', 'where', 'branch', 'office', 'bangalore', 'btm'],
        response: "📍 **Location:**\n\nAppTechno Software\nBTM Layout, Bangalore, India\n\nWe also offer **online training** for students who can't visit in person!",
        priority: 10
    },

    // Contact
    {
        keywords: ['contact', 'email', 'phone', 'call', 'reach', 'support', 'help'],
        response: "📞 **Contact Us:**\n\n• 🌐 Website: appteknow.com\n• 📧 Email: support@apptechcareers.com\n• Visit us at BTM Layout, Bangalore\n\nYou can also use the internal messaging system if you're already enrolled!",
        priority: 10
    },

    // Attendance & Punch
    {
        keywords: ['attendance', 'punch', 'punch in', 'punch out', 'qr', 'scan', 'time tracking'],
        response: "⏰ **Attendance System:**\n\n• Use the **QR scan** feature to punch in/out\n• Multiple punch-in and punch-out allowed per day\n• Your total work hours are calculated automatically\n• View your attendance history in the dashboard\n• QR code is available at the training center\n\nMake sure to punch in when you arrive and punch out when you leave!",
        priority: 10
    },

    // Leave
    {
        keywords: ['leave', 'absent', 'holiday', 'off', 'sick', 'vacation'],
        response: "📋 **Leave Process:**\n\n• Submit leave requests via the dashboard\n• You can view your leave balance and history\n• Leave requests go to your trainer/admin for approval\n• Plan your leaves in advance when possible\n\nNavigate to the Leave section in your sidebar for more details.",
        priority: 10
    },

    // Certificate
    {
        keywords: ['certificate', 'certification', 'experience certificate', 'proof'],
        response: "📜 **Certificates:**\n\nAppTechno provides:\n• **Course Completion Certificate**\n• **6-Month Experience Certificate** (live project work)\n• Project work documentation\n\nThese certificates are valued by employers and help boost your resume significantly!",
        priority: 10
    },

    // Online / Mode
    {
        keywords: ['online', 'offline', 'remote', 'virtual', 'classroom', 'mode'],
        response: "💻 **Training Modes:**\n\n• **Classroom Training** — At BTM Layout, Bangalore\n• **Online Training** — Live virtual classes\n• **Hybrid Mode** — Mix of both\n\nBoth modes include live project experience and placement support!",
        priority: 10
    },

    // Dashboard
    {
        keywords: ['dashboard', 'portal', 'login', 'access', 'account'],
        response: "🖥️ **Your Dashboard:**\n\nAfter logging in, you can:\n• View your courses and batch schedule\n• Track attendance and work hours\n• Access study materials\n• Apply for leave\n• View placement opportunities\n• Check notifications\n\nLog in at the top of the page or visit /login!",
        priority: 10
    },

    // Register / Apply
    {
        keywords: ['register', 'apply', 'enroll', 'join', 'admission', 'sign up', 'signup'],
        response: "✅ **How to Apply:**\n\n1. Click **Apply Now** on the homepage\n2. Fill in your details (name, email, phone)\n3. Choose your interested curriculum\n4. Set your password\n5. Submit your application\n\nOur team will review and activate your account. You can then log in to the dashboard!",
        priority: 10
    },

    // Greetings
    {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'hola'],
        response: "👋 Hello! Welcome to AppTechno Software!\n\nI'm your AI assistant. I can help you with:\n• 📚 Course information\n• 💰 Fee structure\n• 🚀 Placement details\n• 📅 Batch schedules\n• ⏰ Attendance queries\n• 📞 Contact information\n\nJust ask me anything!",
        priority: 5
    },

    // Thanks
    {
        keywords: ['thank', 'thanks', 'thank you', 'awesome', 'great', 'perfect', 'nice', 'cool'],
        response: "😊 You're welcome! Happy to help!\n\nFeel free to ask me anything else about AppTechno courses, placements, or any other queries. I'm here to assist you! 💙",
        priority: 5
    },

    // Bye
    {
        keywords: ['bye', 'goodbye', 'see you', 'later', 'close'],
        response: "👋 Goodbye! Thanks for chatting with me.\n\nRemember, you can always come back and ask me anything about AppTechno Software. Have a great day! 🌟",
        priority: 5
    },
];

const DEFAULT_RESPONSE = "🤔 I'm not sure about that specific question. Here are some things I can help you with:\n\n• 📚 **Courses** — Ask about our programs\n• 💰 **Fees** — Payment structure info\n• 🚀 **Placements** — Job support details\n• 📅 **Schedule** — Batch timing info\n• 📞 **Contact** — How to reach us\n\nTry asking something like \"What courses do you offer?\" or \"Tell me about placements\"!";

const QUICK_QUESTIONS = [
    "What courses do you offer?",
    "Tell me about placements",
    "What is the fee structure?",
    "How do I apply?",
];

function getAIResponse(input: string): string {
    const lower = input.toLowerCase().trim();

    // Score each knowledge base entry
    let bestMatch: { response: string; score: number } = { response: DEFAULT_RESPONSE, score: 0 };

    for (const kb of KNOWLEDGE_BASE) {
        let score = 0;
        for (const keyword of kb.keywords) {
            if (lower.includes(keyword)) {
                score += kb.priority + keyword.length; // Longer keyword matches score higher
            }
        }
        if (score > bestMatch.score) {
            bestMatch = { response: kb.response, score };
        }
    }

    return bestMatch.response;
}

function formatBotText(text: string): string {
    // Convert **bold** to <strong> and \n to <br>
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
}

export default function ChatbotFAQ() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Welcome message
            setMessages([{
                id: 'welcome',
                role: 'bot',
                text: "👋 Hi! I'm the **AppTechno AI Assistant**.\n\nI can help you with information about our courses, placements, fees, schedules, and more.\n\nJust type your question below or tap a quick option! 👇",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking delay
        const delay = 600 + Math.random() * 800;
        setTimeout(() => {
            const response = getAIResponse(text);
            const botMsg: Message = {
                id: `bot-${Date.now()}`,
                role: 'bot',
                text: response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '72px',
                    right: '0',
                    width: '380px',
                    maxWidth: 'calc(100vw - 32px)',
                    height: '560px',
                    maxHeight: 'calc(100vh - 120px)',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,102,255,0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <style jsx>{`
                        @keyframes chatSlideUp {
                            from { opacity: 0; transform: translateY(16px) scale(0.95); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        @keyframes dotPulse {
                            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                            40% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>

                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0044cc, #0066ff)',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '22px'
                            }}>🤖</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>AppTechno AI</h3>
                                <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
                                    Online • Ask me anything
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        >✕</button>
                    </div>

                    {/* Chat Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '12px',
                        background: '#f8fafc',
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{
                                display: 'flex',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                gap: '8px',
                                alignItems: 'flex-end',
                            }}>
                                {msg.role === 'bot' && (
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #0066ff, #3399ff)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', flexShrink: 0,
                                    }}>🤖</div>
                                )}
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, #0066ff, #3399ff)' : '#ffffff',
                                    color: msg.role === 'user' ? '#ffffff' : '#1a1a2e',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    boxShadow: msg.role === 'bot' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                    border: msg.role === 'bot' ? '1px solid #eef1f6' : 'none',
                                }}>
                                    <div dangerouslySetInnerHTML={{ __html: formatBotText(msg.text) }} />
                                    <div style={{
                                        fontSize: '10px',
                                        opacity: 0.6,
                                        marginTop: '4px',
                                        textAlign: msg.role === 'user' ? 'right' : 'left',
                                    }}>{msg.time}</div>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #0066ff, #3399ff)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', flexShrink: 0,
                                }}>🤖</div>
                                <div style={{
                                    background: '#ffffff', border: '1px solid #eef1f6',
                                    borderRadius: '14px 14px 14px 4px',
                                    padding: '12px 16px',
                                    display: 'flex', gap: '4px', alignItems: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <span key={i} style={{
                                            width: '7px', height: '7px', borderRadius: '50%',
                                            background: '#0066ff',
                                            display: 'inline-block',
                                            animation: `dotPulse 1.4s ease infinite ${i * 0.2}s`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick questions (only show at start) */}
                        {messages.length <= 1 && !isTyping && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '36px' }}>
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            color: '#0066ff',
                                            padding: '6px 12px',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: 500,
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#0066ff'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >{q}</button>
                                ))}
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #eef1f6',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        background: '#ffffff',
                        flexShrink: 0,
                    }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            disabled={isTyping}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: '#f5f7fa',
                                color: '#1a1a2e',
                                fontSize: '13px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = '#0066ff'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            style={{
                                width: '38px', height: '38px', borderRadius: '10px',
                                background: input.trim() ? 'linear-gradient(135deg, #0044cc, #0066ff)' : '#e2e8f0',
                                border: 'none', color: '#ffffff',
                                cursor: input.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '16px', transition: 'all 0.2s',
                                flexShrink: 0,
                            }}
                        >➤</button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0044cc, #0066ff)',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.05)' : 'scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 102, 255, 0.5)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 102, 255, 0.35)';
                }}
            >
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
}
