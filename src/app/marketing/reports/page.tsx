'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketingReportsPage() {
    const [leads, setLeads] = useState<any[]>([]);

    // Add date range states for export
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { apiGet('/api/marketing/leads').then(setLeads).catch(() => { }); }, []);

    const byStatus = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'].map(s => ({ status: s, count: leads.filter(l => l.status === s).length }));
    const bySource = ['Website', 'WhatsApp', 'Social Media', 'Reference', 'Walk-in'].map(s => ({ source: s, count: leads.filter(l => l.source === s).length }));
    const convRate = leads.length > 0 ? Math.round(leads.filter(l => l.status === 'CONVERTED').length / leads.length * 100) : 0;

    const barColors: Record<string, string> = { NEW: '#60a5fa', CONTACTED: '#fbbf24', INTERESTED: '#a78bfa', CONVERTED: '#4ade80', LOST: '#f87171' };

    // Process graph data
    const monthlyDataMap: Record<string, number> = {};
    const currentMonthDataMap: Record<string, number> = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    leads.forEach(l => {
        const d = new Date(l.created_at);
        const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyDataMap[monthKey] = (monthlyDataMap[monthKey] || 0) + 1;

        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const dayKey = d.getDate().toString().padStart(2, '0') + " " + d.toLocaleString('default', { month: 'short' });
            currentMonthDataMap[dayKey] = (currentMonthDataMap[dayKey] || 0) + 1;
        }
    });

    const monthlyGrowthData = Object.entries(monthlyDataMap)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, count]) => ({ date, count }));

    const dailyGrowthData = Object.entries(currentMonthDataMap)
        .map(([day, count]) => ({ day: parseInt(day), date: day, count }))
        .sort((a, b) => a.day - b.day);

    const downloadCSV = () => {
        if (!startDate || !endDate) return;
        window.open(`/api/marketing/reports/export?start_date=${startDate}&end_date=${endDate}`, '_blank');
    };

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1 className="page-title">Marketing Reports</h1><p className="page-subtitle">Lead analytics and conversion insights</p></div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📥 Export Leads CSV
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</label>
                            <input className="form-input" style={{ minHeight: 'unset', padding: '6px 10px', fontSize: '13px' }} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</label>
                            <input className="form-input" style={{ minHeight: 'unset', padding: '6px 10px', fontSize: '13px' }} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <button onClick={downloadCSV} style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                        }}>
                            Download
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🎯</div><div className="stat-info"><h3>Total Leads</h3><div className="stat-value">{leads.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">🔄</div><div className="stat-info"><h3>Conversion Rate</h3><div className="stat-value">{convRate}%</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📊</div><div className="stat-info"><h3>Active Pipeline</h3><div className="stat-value">{leads.filter(l => !['CONVERTED', 'LOST'].includes(l.status)).length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">❌</div><div className="stat-info"><h3>Lost</h3><div className="stat-value">{leads.filter(l => l.status === 'LOST').length}</div></div></div>
            </div>

            <div className="grid-2 mb-24">
                <div className="card">
                    <h3 className="font-semibold mb-16">Monthly Lead Growth</h3>
                    {monthlyGrowthData.length > 0 ? (
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data available</div>
                    )}
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-16">Daily Lead Sources (This Month)</h3>
                    {dailyGrowthData.length > 0 ? (
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                                    <Bar dataKey="count" fill="url(#colorCount)" radius={[4, 4, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data available</div>
                    )}
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="font-semibold mb-16">Lead Pipeline</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {byStatus.map(item => (
                            <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ width: '90px', fontSize: '13px', color: '#94a3b8' }}>{item.status}</span>
                                <div style={{ flex: 1, height: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${leads.length > 0 ? (item.count / leads.length) * 100 : 0}%`, height: '100%', background: barColors[item.status], borderRadius: '6px', minWidth: item.count > 0 ? '20px' : '0', transition: 'width 0.5s' }} />
                                </div>
                                <span style={{ width: '30px', fontSize: '14px', fontWeight: 600, color: barColors[item.status], textAlign: 'right' }}>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-16">Leads by Source</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {bySource.filter(s => s.count > 0).map(item => (
                            <div key={item.source} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ width: '120px', fontSize: '13px', color: '#94a3b8' }}>{item.source}</span>
                                <div style={{ flex: 1, height: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${leads.length > 0 ? (item.count / leads.length) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius: '6px', minWidth: '20px' }} />
                                </div>
                                <span style={{ width: '30px', fontSize: '14px', fontWeight: 600, color: '#a5b4fc', textAlign: 'right' }}>{item.count}</span>
                            </div>
                        ))}
                        {bySource.every(s => s.count === 0) && <p className="text-sm text-muted">No lead source data yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
