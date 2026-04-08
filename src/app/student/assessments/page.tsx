'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiFetch } from '@/lib/api';
import WebDevEditor from '@/components/WebDevEditor';
import ProctoringOverlay from '@/components/ProctoringOverlay';

export default function StudentAssessmentsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubmission, setActiveSubmission] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitDone, setSubmitDone] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null); // seconds remaining

    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Proctoring & Lock State
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
    const [faceViolationCount, setFaceViolationCount] = useState(0);
    const [isProctoringActive, setIsProctoringActive] = useState(false);
    const [graceCountdown, setGraceCountdown] = useState<number | null>(null);
    const [violationType, setViolationType] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const heartbeatRef = useRef<any>(null);

    useEffect(() => { loadAssignments(); }, []);

    // Fullscreen and Tab Locking Logic
    useEffect(() => {
        if (!activeSubmission || submitDone) {
            setIsProctoringActive(false);
            setGraceCountdown(null);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            return;
        }

        const onVisibilityChange = () => {
            if (document.hidden && !submitDone) {
                setTabSwitchCount(prev => prev + 1);
                triggerGracePeriod('TAB_SWITCH');
            }
        };

        const onFullscreenChange = () => {
            if (!document.fullscreenElement && !submitDone) {
                setFullscreenExitCount(prev => prev + 1);
                triggerGracePeriod('FULLSCREEN_EXIT');
            }
        };

        const preventSecurityRisks = (e: any) => {
            if (e.type === 'copy' || e.type === 'paste') {
                e.preventDefault();
                alert('Copying & Pasting is strictly disabled during assessments.');
            }
            if (e.type === 'contextmenu') {
                e.preventDefault();
                triggerGracePeriod("Right-click disabled");
            }
            if (e.type === 'keydown') {
                const keyEvent = e as KeyboardEvent;
                if ((keyEvent.ctrlKey || keyEvent.metaKey) && (keyEvent.key.toLowerCase() === 'c' || keyEvent.key.toLowerCase() === 'v')) {
                    keyEvent.preventDefault();
                    alert('Copying & Pasting is strictly disabled during assessments.');
                }
                // Block Alt, Tab, Escape, and Meta/Windows Keys
                if (keyEvent.key === 'Alt' || keyEvent.key === 'Tab' || keyEvent.key === 'Escape' || keyEvent.metaKey) {
                    keyEvent.preventDefault();
                }
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('copy', preventSecurityRisks, { capture: true });
        document.addEventListener('paste', preventSecurityRisks, { capture: true });
        document.addEventListener('keydown', preventSecurityRisks, { capture: true });
        document.addEventListener('contextmenu', preventSecurityRisks, { capture: true });

        // Start Heartbeat
        heartbeatRef.current = setInterval(sendHeartbeat, 30000);

        // Sidebar/body scroll lock
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            document.removeEventListener('copy', preventSecurityRisks, { capture: true });
            document.removeEventListener('paste', preventSecurityRisks, { capture: true });
            document.removeEventListener('keydown', preventSecurityRisks, { capture: true });
            document.removeEventListener('contextmenu', preventSecurityRisks, { capture: true });
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            document.body.style.overflow = 'unset';
        };
    }, [activeSubmission, submitDone]);

    // Timer and Grace Period Countdown
    useEffect(() => {
        let timer: any;
        if (graceCountdown !== null && graceCountdown > 0) {
            timer = setInterval(() => {
                setGraceCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (graceCountdown === 0) {
            forceSubmit('Security Violation: Time-out');
        }

        return () => clearInterval(timer);
    }, [graceCountdown]);

    const triggerGracePeriod = (type: string) => {
        setViolationType(type);
        setGraceCountdown(30);
    };

    const resumeFullscreen = async () => {
        if (containerRef.current) {
            try {
                await containerRef.current.requestFullscreen();
                if ('keyboard' in navigator && (navigator as any).keyboard && (navigator as any).keyboard.lock) {
                    try { await (navigator as any).keyboard.lock(); } catch (e) { console.warn('Keyboard lock not fully supported', e); }
                }
                setGraceCountdown(null);
                setViolationType(null);
            } catch (e) {
                console.error('Fullscreen failed', e);
            }
        }
    };

    const loadAssignments = async () => {
        try {
            setAssignments(await apiGet('/api/training/assignments'));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const startSession = async (assignment: any) => {
        try {
            const res = await apiFetch(`/api/training/assessments/ASSIGNMENT/${assignment.id}/start`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setSessionId(data.session_id);
                setActiveSubmission(assignment);
                setIsProctoringActive(true);
                setSubmitDone(false);
                setContent('');
                setFile(null);
                
                // Trigger auto-fullscreen
                setTimeout(resumeFullscreen, 500);
            } else {
                alert(data.detail || 'Could not start session. You may have already completed this assignment.');
            }
        } catch (e) {
            alert('Error starting session');
        }
    };

    const sendHeartbeat = async () => {
        if (!sessionId || submitDone) return;
        try {
            await apiFetch(`/api/training/assessments/${sessionId}/heartbeat`, {
                method: 'POST',
                body: JSON.stringify({
                    answers: { content }, // Save progress
                    fullscreen_exited: fullscreenExitCount > 0,
                    face_violation: faceViolationCount > 0,
                    tab_switched: tabSwitchCount > 0
                })
            });
        } catch (e) { console.error('Heartbeat failed', e); }
    };

    const forceSubmit = async (reason: string) => {
        alert(`Assignment Auto-Submitted: ${reason}`);
        submitHandler(true);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    const submitHandler = async (isAuto = false) => {
        if (submitLoading) return;
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            if (content) formData.append('content', content);
            if (file) formData.append('file', file);
            
            const url = isAuto ? `/api/training/assessments/${sessionId}/submit` : `/api/training/assignments/${activeSubmission.id}/submit`;

            const res = await apiFetch(url, {
                method: 'POST',
                body: isAuto ? JSON.stringify({ answers: { content } }) : formData
            });

            if (res.ok) {
                setSubmitDone(true);
                if (document.fullscreenElement) document.exitFullscreen();
                setTimeout(() => {
                    setActiveSubmission(null);
                    setSessionId(null);
                    setSubmitDone(false);
                    loadAssignments();
                }, 2000);
            } else {
                alert('Submission failed.');
            }
        } catch (error) {
            alert('Error submitting.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Assignments</h1>
                    <p className="page-subtitle">Standard proctored assessments environment</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{assignments.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Submitted</h3><div className="stat-value">{assignments.filter(a => a.my_submission).length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⏰</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">{assignments.filter(a => !a.my_submission).length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">🔒</div><div className="stat-info"><h3>Security</h3><div className="stat-value">Active</div></div></div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {assignments.map(a => (
                        <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontWeight: 600 }}>{a.title}</h3>
                                <span className={`badge ${a.my_submission ? 'badge-success' : 'badge-warning'}`}>
                                    {a.my_submission ? 'Completed' : 'Pending'}
                                </span>
                            </div>
                            <p className="text-muted text-sm">{a.description?.slice(0, 100)}...</p>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: 'auto' }}
                                onClick={() => startSession(a)}
                                disabled={a.my_submission || isOverdue(a.due_date)}
                            >
                                {a.my_submission ? 'Already Attempted' : 'Start Secure Assessment'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Proctoring Implementation */}
            {activeSubmission && typeof document !== 'undefined' && createPortal(
                <div ref={containerRef} style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    zIndex: 9999999, background: 'var(--bg-primary)', 
                    display: 'flex', flexDirection: 'column', overflow: 'hidden' 
                }}>
                    <ProctoringOverlay 
                        isActive={isProctoringActive && !submitDone}
                        onViolation={(type) => {
                            if (type === 'NO_FACE' || type === 'MULTI_FACE') {
                                setFaceViolationCount(prev => prev + 1);
                                triggerGracePeriod(type);
                            } else if (type === 'SCREEN_STOPPED') {
                                forceSubmit('Screen sharing stopped');
                            }
                        }}
                        onMetricsUpdate={() => {}}
                    />

                    {/* Grace Period Overlay */}
                    {graceCountdown !== null && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10000001,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', color: '#fff', padding: '40px'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
                            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>Security Violation Detected</h2>
                            <p style={{ fontSize: '18px', opacity: 0.8, maxWidth: '500px', marginBottom: '40px' }}>
                                Type: <span style={{ color: '#ef4444', fontWeight: 700 }}>{violationType?.replace('_', ' ')}</span><br />
                                Please return to fullscreen and ensure only one face is visible.
                            </p>
                            
                            <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '48px' }}>
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#ef4444" strokeWidth="8" 
                                        strokeDasharray="339.292" strokeDashoffset={339.292 * (1 - graceCountdown / 30)}
                                        style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '32px', fontWeight: 800 }}>
                                    {graceCountdown}
                                </div>
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={resumeFullscreen} style={{ padding: '16px 48px' }}>
                                Resume Assessment
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="modal-title">{activeSubmission.title}</h2>
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Proctoring Active • Do not switch tabs</div>
                        </div>

                        {submitDone ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div><div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div><h3>Submitted Successfully</h3></div>
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); submitHandler(); }} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ flex: 1, minHeight: 0, marginBottom: '16px' }}>
                                    <WebDevEditor code={content} onChange={setContent} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                                    <button type="submit" className="btn btn-primary" disabled={submitLoading || content.length < 10}>
                                        {submitLoading ? 'Submitting...' : 'Complete & Submit'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>, document.body
            )}
        </div>
    );
}
