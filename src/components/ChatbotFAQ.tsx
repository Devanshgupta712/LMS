'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    time: string;
}

const DEFAULT_RESPONSE = "🤔 I'm experiencing a temporary network issue connecting to my brain. However, here are some things I can help you with:\n\n• 📚 **Courses** — Ask about our programs\n• 💰 **Fees** — Payment structure info\n• 🚀 **Placements** — Job support details\n• 📅 **Schedule** — Batch timing info\n• 📞 **Contact** — How to contact us\n\nTry asking me another question in a moment!";

const QUICK_QUESTIONS = [
    "What courses do you offer?",
    "I'm looking for a beginner course",
    "Tell me about placements",
    "I need technical help",
];

async function getGeminiResponse(userMessage: string, previousMessages: Message[]): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        return "⚠️ Chatbot is not configured. Please contact support@apptechcareers.com.";
    }

    // Convert previous messages to Gemini format
    const contents = previousMessages
        .filter(m => m.id !== 'welcome' && !m.id.startsWith('bot-typing'))
        .map(m => ({
            role: m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));
        
    // Append the new user message
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const systemInstruction = `You are the AppTechno AI Assistant. Help users with information about courses, placements, fees, schedules, attendance, and technical training.

AppTechno Software offers 6-month intensive training programs:
- Full Stack Java: Java, Spring Boot, Angular, Microservices. Duration: 6 Months. Fee: ₹49,999.
- Python Django React: Python, Django, React, REST API. Duration: 6 Months. Fee: ₹54,999.
- MERN Stack: MongoDB, Express, React, Node.js. Duration: 6 Months. Fee: ₹52,999.
- Software Testing: Manual, Selenium, API Testing. Duration: 6 Months.
- Data Analytics: SQL, Power BI, Python. Duration: 6 Months. Fee: ₹59,999.
- Data Science: Machine Learning, Data Modeling. Duration: 6 Months.

Guidelines:
- Provide course name, description, and duration when asked.
- Suggest relevant courses based on the user's query (e.g. if they say "I want to build websites", suggest MERN).
- Provide help instructions: If they have issues, tell them to use the dashboard or contact support@apptechcareers.com.
- Emphasize that all courses include live project experience and a 6-month experience certificate.
- Mention 70,000+ placed students with a 14LPA average package, and unlimited interviews.
- Keep responses concise, supportive, and formatted beautifully in markdown.`;

    try {
        // Inject system prompt as first conversation turn (compatible with all API versions)
        const allContents = [
            { role: 'user', parts: [{ text: `Context: ${systemInstruction}\n\nStart the conversation.` }] },
            { role: 'model', parts: [{ text: "Hi! I'm the AppTechno AI Assistant. I can help you with courses, placements, fees and more! How can I help you today?" }] },
            ...contents
        ];

        // gemini-2.0-flash confirmed available with this API key
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: allContents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
                })
            }
        );

        if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            console.error(`Gemini API Error ${res.status}:`, errText);
            return `⚠️ AI Error (${res.status}): ${errText.slice(0, 150)}`;
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || DEFAULT_RESPONSE;
    } catch (e: any) {
        console.error('Gemini fetch error:', e);
        return DEFAULT_RESPONSE;
    }
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

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
        setInput('');
        setIsTyping(true);

        const responseText = await getGeminiResponse(text, currentMessages);

        const botMsg: Message = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: responseText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="chatbot-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            <style jsx>{`
                @media (max-width: 768px) {
                    .chatbot-container {
                        bottom: 80px !important;
                    }
                }
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes dotPulse {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '72px',
                    right: '0',
                    width: '380px',
                    maxWidth: 'calc(100vw - 32px)',
                    height: '500px',
                    maxHeight: 'calc(100vh - 180px)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,102,255,0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>

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
                        background: 'var(--bg-primary)',
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
                                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
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
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border)',
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
                        background: 'var(--bg-primary)',
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
                                border: '1px solid var(--border)',
                                background: '#f5f7fa',
                                color: 'var(--text-primary)',
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
