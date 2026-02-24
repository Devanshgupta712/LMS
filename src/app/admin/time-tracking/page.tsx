'use client';

import { useState } from 'react';

export default function TimeTrackingPage() {
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Time Tracking</h1><p className="page-subtitle">Monitor student and trainer login hours</p></div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">⏱️</div><div className="stat-info"><h3>Avg. Daily Hours</h3><div className="stat-value">6.5h</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">👥</div><div className="stat-info"><h3>Active Today</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>On Time</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⚠️</div><div className="stat-info"><h3>Late Arrivals</h3><div className="stat-value">0</div></div></div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="font-semibold">Time Logs — {selectedDate}</h3>
                </div>
                <div className="empty-state" style={{ padding: '60px 16px' }}>
                    <div className="empty-icon">⏱️</div>
                    <h3>No time logs recorded</h3>
                    <p className="text-sm text-muted">Time tracking data will appear here when students log their hours.</p>
                </div>
            </div>
        </div>
    );
}
