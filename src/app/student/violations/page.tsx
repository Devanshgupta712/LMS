'use client';

import { useState, useEffect } from 'react';
import { apiGet, getStoredUser } from '@/lib/api';

interface ViolationItem {
    id: string; type: string; severity: string; status: string;
    title: string; description: string | null;
    penalty_points: number;
    resolution_note: string | null; created_at: string;
    resolved_at: string | null; resolved_by: string | null;
}

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    DEADLINE_MISSED: { icon: '⏰', color: '#ef4444', label: 'Deadline Missed' },
    LATE_SUBMISSION: { icon: '📅', color: '#f97316', label: 'Late Submission' },
    INCOMPLETE_WORK: { icon: '⚠️', color: '#f59e0b', label: 'Incomplete Work' },
    POOR_ACADEMIC_PERFORMANCE: { icon: '📉', color: '#f59e0b', label: 'Poor Academic Performance' },
    LOW_ATTENDANCE: { icon: '🚫', color: '#0066ff', label: 'Low Attendance Warning' },
    UNAUTHORIZED_ASSISTANCE: { icon: '🤖', color: '#dc2626', label: 'Unauthorized Assistance (AI/Cheating)' },
    HONOR_CODE_VIOLATION: { icon: '⚖️', color: '#9f1239', label: 'Honor Code Violation' },
    DISRUPTIVE_BEHAVIOR: { icon: '🚨', color: '#b91c1c', label: 'Disruptive Behavior' },
    PLAGIARISM: { icon: '📋', color: '#dc2626', label: 'Plagiarism' },
    CODE_VIOLATION: { icon: '💻', color: '#0066ff', label: 'Code Violation' },
    OTHER: { icon: '❓', color: '#64748b', label: 'Other' },
};

const severityConfig: Record<string, { color: string; bg: string }> = {
    LOW: { color: '#10b981', bg: '#10b98118' },
    MEDIUM: { color: '#f59e0b', bg: '#f59e0b18' },
    HIGH: { color: '#f97316', bg: '#f9731618' },
    CRITICAL: { color: '#ef4444', bg: '#ef444418' },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
    OPEN: { color: '#ef4444', bg: '#ef444418' },
    ACKNOWLEDGED: { color: '#f59e0b', bg: '#f59e0b18' },
    RESOLVED: { color: '#10b981', bg: '#10b98118' },
    DISMISSED: { color: '#64748b', bg: '#64748b18' },
};

export default function StudentViolationsPage() {
    const [violations, setViolations] = useState<ViolationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            apiGet(`/api/training/violations?student_id=${user.id}`)
                .then(setViolations)
                .catch(() => { })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const totalPoints = violations.reduce((acc, v) => acc + v.penalty_points, 0);
    const activeViolations = violations.filter(v => v.status === 'OPEN').length;

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Integrity & Warnings</h1>
                    <p className="page-subtitle">View your disciplinary record and academic warnings</p>
                </div>
            </div>

            <div className="grid-3 mb-24">
                <div className="stat-card primary">
                    <div className="stat-icon primary">📋</div>
                    <div className="stat-info">
                        <h3>Total Issues</h3>
                        <div className="stat-value">{violations.length}</div>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon danger">🔴</div>
                    <div className="stat-info">
                        <h3>Active Warnings</h3>
                        <div className="stat-value">{activeViolations}</div>
                    </div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent">💔</div>
                    <div className="stat-info">
                        <h3>Penalty Points</h3>
                        <div className="stat-value">{totalPoints}</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <p>Loading records...</p>
            ) : violations.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                        <h3>Excellent Standing</h3>
                        <p className="text-sm text-muted">You have no academic warnings or disciplinary actions on record.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {violations.map(v => {
                        const tCfg = typeConfig[v.type] || typeConfig.OTHER;
                        const sCfg = severityConfig[v.severity] || severityConfig.MEDIUM;
                        const stCfg = statusConfig[v.status] || statusConfig.OPEN;

                        return (
                            <div key={v.id} className="card" style={{ borderLeft: `4px solid ${tCfg.color}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '24px' }}>{tCfg.icon}</span>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{v.title}</h3>
                                    <span style={{ background: tCfg.color + '18', color: tCfg.color, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                        {tCfg.label}
                                    </span>
                                    <span style={{ background: sCfg.bg, color: sCfg.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                        Severity: {v.severity}
                                    </span>
                                    <span style={{ background: stCfg.bg, color: stCfg.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                        {v.status}
                                    </span>
                                </div>

                                {v.description && (
                                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
                                        {v.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                                    <span>📅 Issued: {new Date(v.created_at).toLocaleDateString()}</span>
                                    {v.penalty_points > 0 && (
                                        <span style={{ color: '#ef4444', fontWeight: 500 }}>
                                            ⚠️ Penalty: -{v.penalty_points} pts
                                        </span>
                                    )}
                                    {v.resolved_by && (
                                        <span style={{ color: '#10b981' }}>
                                            ✅ Resolved on {v.resolved_at ? new Date(v.resolved_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    )}
                                </div>

                                {v.resolution_note && (
                                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#10b98110', borderLeft: '3px solid #10b981', borderRadius: '4px 8px 8px 4px', fontSize: '13px', color: '#6ee7b7' }}>
                                        <strong>Resolution Note:</strong> {v.resolution_note}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

