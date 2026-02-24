'use client';

import { useState, useEffect } from 'react';
import { getStoredUser } from '@/lib/api';

export default function PracticePage() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (user) setIsAdmin(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
    }, []);

    const topics = [
        { title: 'Self Introduction', icon: '👤', desc: 'Practice your elevator pitch and personal introduction', difficulty: 'Easy' },
        { title: 'Technical Q&A', icon: '💻', desc: 'Common technical interview questions for your domain', difficulty: 'Medium' },
        { title: 'Group Discussion', icon: '👥', desc: 'Practice group discussion skills and topic analysis', difficulty: 'Medium' },
        { title: 'HR Round', icon: '🗣️', desc: 'Behavioral and situational interview questions', difficulty: 'Easy' },
        { title: 'Case Studies', icon: '📊', desc: 'Solve real-world business and technical case studies', difficulty: 'Hard' },
        { title: 'Coding Challenges', icon: '⌨️', desc: 'Practice DSA and coding problems', difficulty: 'Hard' },
    ];

    const diffColor: Record<string, string> = { Easy: 'badge-success', Medium: 'badge-warning', Hard: 'badge-danger' };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Communication Practice</h1><p className="page-subtitle">Improve your communication and interview skills</p></div>
            </div>

            <div className="grid-3">
                {topics.map(t => (
                    <div key={t.title} className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{t.icon}</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{t.title}</h3>
                        <p className="text-sm text-muted" style={{ margin: '0 0 12px', lineHeight: '1.5' }}>{t.desc}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`badge ${diffColor[t.difficulty]}`}>{t.difficulty}</span>
                            {isAdmin ? (
                                <button className="btn btn-sm btn-ghost">Manage</button>
                            ) : (
                                <button className="btn btn-sm btn-primary">Start Practice</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
