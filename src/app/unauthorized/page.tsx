import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="login-page">
            <div className="login-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                    Access Denied
                </h1>
                <p className="text-muted" style={{ marginBottom: '24px' }}>
                    You don&apos;t have permission to access this page. Please contact your administrator.
                </p>
                <Link href="/dashboard" className="btn btn-primary">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
