'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiFetch } from '@/lib/api';
import Editor from '@monaco-editor/react';

interface Question {
    index: number;
    question: string;
    options: string[];
}

interface RunResult {
    stdout: string;
    stderr: string;
    code: number;
}

export default function AssessmentSessionPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    // Assessment Data
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [timeLimitMins, setTimeLimitMins] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    // Anti-Cheating
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    // User Input State
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [codeStr, setCodeStr] = useState<string>('# Write your Python code here\n');
    const [language, setLanguage] = useState('python');

    // Code Runner State
    const [runningCode, setRunningCode] = useState(false);
    const [runOutput, setRunOutput] = useState<RunResult | null>(null);

    // Final Results State
    const [finalScore, setFinalScore] = useState<number | null>(null);
    const [results, setResults] = useState<any[]>([]);

    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const isCompletedRef = useRef(false);

    useEffect(() => {
        if (!taskId) return;
        startSession();

        // Anti-cheating: Tab switch detection
        const handleVisibilityChange = () => {
            if (document.hidden && !isCompletedRef.current && sessionId) {
                logTabSwitch();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    // Keep ref updated
    useEffect(() => { isCompletedRef.current = isCompleted; }, [isCompleted]);

    const startSession = async () => {
        try {
            // 1. Start or resume
            let res = await apiFetch(`/api/training/assessments/TASK/${taskId}/start`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to start assessment');
            const startData = await res.json();
            setSessionId(startData.session_id);

            // 2. Fetch questions/details
            const qData = await apiGet(`/api/training/assessments/${startData.session_id}/questions`);
            setTitle(qData.title);
            setDescription(qData.description);
            setQuestions(qData.questions || []);
            setTimeLimitMins(qData.time_limit_mins);
            setRemainingSeconds(qData.remaining_seconds);
            setIsCompleted(qData.is_completed);
            setTabSwitchCount(qData.tab_switch_count || 0);

            if (qData.is_completed) {
                // If it was already completed, fetch score (or we could fetch ranking)
                // For a polished flow, you'd fetch the submission details here.
                setFinalScore(0); // placeholder, actual score is fetched differently in production usually
            } else {
                // 3. Start Heartbeat
                startHeartbeat(startData.session_id);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const startHeartbeat = (sid: string) => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(async () => {
            if (isCompletedRef.current) return;
            try {
                // Use current state via refs if needed, or send current answers
                setAnswers(currentAnswers => {
                    apiFetch(`/api/training/assessments/${sid}/heartbeat`, {
                        method: 'POST',
                        body: JSON.stringify({ answers: currentAnswers })
                    }).then(res => res.json()).then(data => {
                        if (data.status === 'auto_submitted') {
                            alert(`Assessment Auto-Submitted: ${data.reason.replace('_', ' ')}`);
                            handleSubmissionResult(true);
                        } else {
                            if (data.remaining_seconds !== undefined) {
                                setRemainingSeconds(data.remaining_seconds);
                            }
                            if (data.tab_switch_count !== undefined) {
                                setTabSwitchCount(data.tab_switch_count);
                            }
                        }
                    }).catch(console.error);
                    return currentAnswers; // don't mutate state
                });
            } catch (e) { console.error('Heartbeat failed', e); }
        }, 5000);
    };

    const logTabSwitch = async () => {
        try {
            const res = await apiFetch(`/api/training/assessments/${sessionId}/heartbeat`, {
                method: 'POST',
                body: JSON.stringify({ tab_switched: true })
            });
            const data = await res.json();
            if (data.status === 'auto_submitted') {
                alert('You have switched tabs too many times. Your assessment has been auto-submitted.');
                handleSubmissionResult(true);
            } else {
                alert(`Warning! Tab switch detected. Switch count: ${data.tab_switch_count}/3. At 3, your assessment will be submitted automatically.`);
                setTabSwitchCount(data.tab_switch_count);
            }
        } catch (e) { console.error('Failed to log tab switch', e); }
    };

    const handleAnswerSelect = (qIndex: number, optIndex: number) => {
        setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
    };

    const submitAssessment = async () => {
        if (!confirm('Are you sure you want to finish and submit the assessment?')) return;
        setLoading(true);
        try {
            const res = await apiFetch(`/api/training/assessments/${sessionId}/submit`, {
                method: 'POST',
                // If it's a coding task (questions length 0), we submit the code as the answer
                body: JSON.stringify({ answers: questions.length ? answers : { "0": codeStr } })
            });
            const data = await res.json();
            if (res.ok) {
                setFinalScore(data.score);
                setResults(data.results || []);
                setIsCompleted(true);
                if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            } else {
                alert(data.detail || 'Submit failed');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred while submitting.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmissionResult = (wasAuto: boolean) => {
        setIsCompleted(true);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        // Force a submit call to finalize score
        apiFetch(`/api/training/assessments/${sessionId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers: answers })
        }).then(res => res.json()).then(data => {
            setFinalScore(data.score || 0);
            setResults(data.results || []);
        });
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const runCode = async () => {
        setRunningCode(true);
        setRunOutput(null);
        try {
            const res = await apiFetch('/api/training/run-code', {
                method: 'POST',
                body: JSON.stringify({ language, code: codeStr })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Execution failed');
            setRunOutput(data);
        } catch (e: any) {
            setRunOutput({ stdout: '', stderr: e.message, code: 1 });
        } finally {
            setRunningCode(false);
        }
    };

    if (loading && !isCompleted && !questions.length) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Secure Session...</div>;
    if (error) return <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>{error}</div>;

    const isCodingTask = questions.length === 0;

    // ─── POST-QUIZ RESULTS VIEW ───
    if (isCompleted) {
        return (
            <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                    <h2>Assessment Completed</h2>
                    {finalScore !== null && !isCodingTask && (
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', margin: '20px 0' }}>
                            Score: {finalScore}%
                        </div>
                    )}
                    {isCodingTask && (
                         <div style={{ fontSize: '18px', margin: '20px 0' }}>
                            Your code has been submitted successfully to the trainer for grading.
                        </div>
                    )}
                    <button className="btn btn-primary" onClick={() => router.push('/student/tasks')}>Return to Tasks</button>
                    {tabSwitchCount >= 3 && (
                        <p style={{ marginTop: '16px', color: 'red', fontWeight: 'bold' }}>This assessment was auto-submitted due to tab switching rules.</p>
                    )}
                </div>

                {/* Provide Feedback on MCQs */}
                {!isCodingTask && results.length > 0 && (
                    <div style={{ marginTop: '32px' }}>
                        <h3 className="section-title">Review Answers</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {results.map((r, i) => (
                                <div key={i} className="card" style={{ border: `1px solid ${r.is_correct ? '#4ade80' : '#ef4444'}` }}>
                                    <p style={{ fontWeight: 600, fontSize: '15px' }}>{i + 1}. {r.question}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                        {r.options.map((opt: string, optIdx: number) => {
                                            const isSelected = r.selected === optIdx.toString() || r.selected === optIdx;
                                            const isCorrectActual = r.correct === optIdx;
                                            let bg = 'var(--bg-secondary)';
                                            let border = '1px solid var(--border)';
                                            if (isCorrectActual) { bg = 'rgba(74, 222, 128, 0.1)'; border = '1px solid #4ade80'; }
                                            else if (isSelected && !r.is_correct) { bg = 'rgba(239, 68, 68, 0.1)'; border = '1px solid #ef4444'; }
                                            
                                            return (
                                                <div key={optIdx} style={{ padding: '10px 14px', borderRadius: '8px', background: bg, border, display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                                    {isCorrectActual && <span>✅</span>}
                                                    {isSelected && !r.is_correct && <span>❌</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {r.explanation && !r.is_correct && (
                                        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--primary-glow)', borderRadius: '8px', fontSize: '13px', color: 'var(--primary)' }}>
                                            <strong>Explanation:</strong> {r.explanation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── ACTIVE ASSESSMENT UI ───
    return (
        <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--bg-primary)', position: 'sticky', top: '10px', zIndex: 10, padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title || 'Assessment'}</h2>
                    {tabSwitchCount > 0 && <span style={{ fontSize: '12px', color: 'red', fontWeight: 600 }}>⚠️ Tab Switches: {tabSwitchCount}/3</span>}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {remainingSeconds !== null && (
                        <div style={{ fontSize: '20px', fontWeight: 800, color: remainingSeconds < 60 ? '#ef4444' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            ⏱️ {formatTime(remainingSeconds)}
                        </div>
                    )}
                    <button className="btn btn-primary" onClick={submitAssessment} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit & Finish'}
                    </button>
                </div>
            </div>

            {description && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <p style={{ margin: 0 }}>{description}</p>
                </div>
            )}

            {/* MCQ ENGINE */}
            {!isCodingTask && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {questions.map((q, i) => (
                        <div key={i} className="card" style={{ padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', lineHeight: '1.5' }}>
                                {i + 1}. {q.question}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                        background: answers[q.index] === optIdx ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                                        border: `1px solid ${answers[q.index] === optIdx ? 'var(--primary)' : 'transparent'}`,
                                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
                                    }}>
                                        <input
                                            type="radio"
                                            name={`q_${q.index}`}
                                            checked={answers[q.index] === optIdx}
                                            onChange={() => handleAnswerSelect(q.index, optIdx)}
                                            style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                                        />
                                        <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CODING WORKSPACE */}
            {isCodingTask && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
                    <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <select className="form-input" style={{ width: '150px', padding: '6px 12px', fontSize: '13px' }} value={language} onChange={e => setLanguage(e.target.value)}>
                                    <option value="python">Python</option>
                                    <option value="javascript">Node.js</option>
                                    <option value="java">Java</option>
                                    <option value="c++">C++</option>
                                </select>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={runCode} disabled={runningCode}>
                                {runningCode ? 'Running...' : '▶ Run Code'}
                            </button>
                        </div>
                        <div style={{ height: '400px', width: '100%' }}>
                            <Editor
                                height="100%"
                                language={language}
                                theme="vs-dark"
                                value={codeStr}
                                onChange={val => setCodeStr(val || '')}
                                options={{ minimap: { enabled: false }, fontSize: 14, tabSize: 4 }}
                            />
                        </div>
                    </div>

                    {/* Console Output */}
                    <div className="card" style={{ background: '#1e1e1e', color: '#fff', padding: '16px', fontFamily: 'monospace', minHeight: '150px' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>CONSOLE OUTPUT</div>
                        {runOutput ? (
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.5 }}>
                                {runOutput.stderr ? (
                                    <span style={{ color: '#ef4444' }}>{runOutput.stderr}</span>
                                ) : (
                                    <span style={{ color: '#4ade80' }}>{runOutput.stdout || 'Program exited with code 0'}</span>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#555', fontSize: '13px' }}>Click 'Run Code' to see output here. Execution limited to 5s and disabled network access.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
