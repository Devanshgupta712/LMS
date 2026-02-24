'use client';

export default function VideosPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Training Videos</h1><p className="page-subtitle">Upload and manage course video content</p></div>
                <button className="btn btn-primary">+ Upload Video</button>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🎬</div><div className="stat-info"><h3>Total Videos</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">👁️</div><div className="stat-info"><h3>Total Views</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">⏱️</div><div className="stat-info"><h3>Total Duration</h3><div className="stat-value">0h</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">📚</div><div className="stat-info"><h3>Courses Covered</h3><div className="stat-value">0</div></div></div>
            </div>

            <div className="card">
                <div className="empty-state" style={{ padding: '60px 16px' }}>
                    <div className="empty-icon">🎬</div>
                    <h3>No Videos Uploaded</h3>
                    <p className="text-sm text-muted">Upload training videos to make them accessible to students.</p>
                </div>
            </div>
        </div>
    );
}
