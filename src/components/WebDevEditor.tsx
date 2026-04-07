import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { apiFetch } from '@/lib/api';

interface WebDevEditorProps {
    code: string;
    onChange: (val: string) => void;
    title?: string;
    description?: string;
}

export default function WebDevEditor({ code, onChange, title, description }: WebDevEditorProps) {
    const [previewCode, setPreviewCode] = useState(code);
    const [language, setLanguage] = useState<'html' | 'python' | 'java'>('html');
    const [running, setRunning] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState<{ stdout: string; stderr: string } | null>(null);

    const handleRun = async () => {
        if (language === 'html') {
            setPreviewCode(code);
        } else {
            setRunning(true);
            setConsoleOutput(null);
            try {
                const res = await apiFetch('/api/training/run-code', {
                    method: 'POST',
                    body: JSON.stringify({ code, language })
                });
                const data = await res.json();
                setConsoleOutput(data);
            } catch (err) {
                setConsoleOutput({ stdout: '', stderr: 'Network Check: Unable to connect to code execution server.' });
            } finally {
                setRunning(false);
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span>🌐 Universal IDE</span>
                        <select 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '150px', background: 'var(--bg-primary)' }}
                            value={language}
                            onChange={(e) => {
                                setLanguage(e.target.value as any);
                                setConsoleOutput(null);
                            }}
                        >
                            <option value="html">Web (HTML/CSS/JS)</option>
                            <option value="python">Python 3</option>
                            <option value="java">Java</option>
                        </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleRun} disabled={running}>
                        {running ? 'Running...' : '▶ Run Code'}
                    </button>
                </div>
                
                {/* Two Column Layout for Code and Output */}
                <div style={{ display: 'flex', flex: 1, minHeight: '500px' }}>
                    
                    {/* Monaco Editor Panel */}
                    <div style={{ flex: 1, borderRight: '1px solid var(--border)', background: '#1e1e1e' }}>
                        <Editor
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => onChange(val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                tabSize: 4,
                                scrollBeyondLastLine: false,
                                wordWrap: 'on'
                            }}
                        />
                    </div>

                    {/* Live Browser Playground Preview Panel or Console Output */}
                    <div style={{ flex: 1, background: language === 'html' ? '#fff' : '#1e1e1e', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        {language === 'html' ? (
                            <>
                                <div style={{ padding: '4px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{width: 8, height: 8, borderRadius: '50%', background: '#ef4444'}}></div>
                                    <div style={{width: 8, height: 8, borderRadius: '50%', background: '#f59e0b'}}></div>
                                    <div style={{width: 8, height: 8, borderRadius: '50%', background: '#10b981'}}></div>
                                    <span style={{marginLeft: '8px'}}>Live Browser Preview</span>
                                </div>
                                <iframe
                                    style={{ width: '100%', flex: 1, border: 'none' }}
                                    srcDoc={previewCode}
                                    sandbox="allow-scripts"
                                    title="live-preview"
                                />
                            </>
                        ) : (
                            <div style={{ padding: '16px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>CONSOLE OUTPUT</div>
                                <div style={{ flex: 1, overflowY: 'auto', background: '#000', padding: '12px', borderRadius: '4px' }}>
                                    {consoleOutput ? (
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.5 }}>
                                            {consoleOutput.stderr ? (
                                                <span style={{ color: '#ef4444' }}>{consoleOutput.stderr}</span>
                                            ) : (
                                                <span style={{ color: '#4ade80' }}>{consoleOutput.stdout || 'Program exited with code 0'}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#555', fontSize: '12px' }}>Output will appear here after running...</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {language === 'html' && (
                <p className="text-muted text-sm" style={{margin: 0}}>
                    💡 Tip: You can write standard HTML elements, use `&lt;style&gt;` blocks for CSS, and script functionality via `&lt;script&gt;` all in this same editor! 
                </p>
            )}
        </div>
    );
}
