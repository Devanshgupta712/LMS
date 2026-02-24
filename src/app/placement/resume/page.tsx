'use client';

export default function ResumePage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Resume Builder</h1><p className="page-subtitle">Create and manage professional resumes</p></div>
                <button className="btn btn-primary">+ Create Resume</button>
            </div>

            <div className="grid-2">
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                    <h3 style={{ marginBottom: '8px' }}>Professional Template</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: '16px' }}>Clean, modern format suitable for IT roles</p>
                    <button className="btn btn-primary">Use Template</button>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ marginBottom: '8px' }}>Academic Template</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: '16px' }}>Highlights education, projects, and skills</p>
                    <button className="btn btn-ghost">Use Template</button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
                <h3 className="font-semibold mb-16">My Resumes</h3>
                <div className="empty-state" style={{ padding: '40px 16px' }}>
                    <div className="empty-icon">📄</div>
                    <h3>No resumes created yet</h3>
                    <p className="text-sm text-muted">Choose a template above to start building your resume.</p>
                </div>
            </div>
        </div>
    );
}
