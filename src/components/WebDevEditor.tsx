import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface WebDevEditorProps {
    code: string;
    onChange: (val: string) => void;
    title?: string;
    description?: string;
}

export default function WebDevEditor({ code, onChange, title, description }: WebDevEditorProps) {
    const [previewCode, setPreviewCode] = useState(code);

    const handleRun = () => {
        setPreviewCode(code);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🌐 <span>Web IDE <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>(HTML / CSS / JS)</span></span>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleRun}>
                        ▶ Run Code
                    </button>
                </div>
                
                {/* Two Column Layout for Code and Output */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '500px' }}>
                    
                    {/* Monaco Editor Panel */}
                    <div style={{ borderRight: '1px solid var(--border)', background: '#1e1e1e' }}>
                        <Editor
                            height="100%"
                            language="html"
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => onChange(val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                tabSize: 4,
                                scrollBeyondLastLine: false,
                                wordWrap: 'on'
                            }}
                        />
                    </div>

                    {/* Live Browser Playground Preview Panel */}
                    <div style={{ background: '#fff', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '4px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{width: 8, height: 8, borderRadius: '50%', background: '#ef4444'}}></div>
                            <div style={{width: 8, height: 8, borderRadius: '50%', background: '#f59e0b'}}></div>
                            <div style={{width: 8, height: 8, borderRadius: '50%', background: '#10b981'}}></div>
                            <span style={{marginLeft: '8px'}}>Live Browser Preview</span>
                        </div>
                        <iframe
                            style={{ width: '100%', height: 'calc(100% - 28px)', marginTop: '28px', border: 'none' }}
                            srcDoc={previewCode}
                            sandbox="allow-scripts"
                            title="live-preview"
                        />
                    </div>

                </div>
            </div>
            <p className="text-muted text-sm" style={{margin: 0}}>
                💡 Tip: You can write standard HTML elements, use `&lt;style&gt;` blocks for CSS, and script functionality via `&lt;script&gt;` all in this same editor! 
            </p>
        </div>
    );
}
