'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

interface SidebarProps {
    userRole: string;
    userName: string;
    userEmail: string;
    isOpen?: boolean;
    onClose?: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: string;
    roles?: string[];
}

interface NavSection {
    title: string;
    items: NavItem[];
    roles: string[];
}

const navSections: NavSection[] = [
    {
        title: 'Overview',
        roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'MARKETER'],
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        ],
    },
    {
        title: 'Marketing',
        roles: ['SUPER_ADMIN', 'ADMIN', 'MARKETER'],
        items: [
            { label: 'Leads', href: '/marketing/leads', icon: '🎯' },
            { label: 'Campaigns', href: '/marketing/campaigns', icon: '📧' },
            { label: 'Reports', href: '/marketing/reports', icon: '📈' },
        ],
    },
    {
        title: 'Administration',
        roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
        items: [
            { label: 'Courses', href: '/admin/courses', icon: '📚', roles: ['SUPER_ADMIN', 'ADMIN'] },
            { label: 'Batches', href: '/admin/batches', icon: '👥', roles: ['SUPER_ADMIN', 'ADMIN'] },
            { label: 'Registrations', href: '/admin/registrations', icon: '📝', roles: ['SUPER_ADMIN', 'ADMIN'] },
            { label: 'Students', href: '/admin/students', icon: '🎓' },
            { label: 'Leaves', href: '/admin/leaves', icon: '🗓️' },
            { label: 'Time Tracking', href: '/admin/time-tracking', icon: '⏱️', roles: ['SUPER_ADMIN', 'ADMIN'] },
            { label: 'Reports', href: '/admin/reports', icon: '📈', roles: ['SUPER_ADMIN', 'ADMIN'] },
        ],
    },
    {
        title: 'Training',
        roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'],
        items: [
            { label: 'Attendance', href: '/training/attendance', icon: '✅' },
            { label: 'Work Hour', href: '/student/time-tracking', icon: '⏱️' },
            { label: 'Projects', href: '/training/projects', icon: '🏗️' },
            { label: 'Tasks', href: '/training/tasks', icon: '📋' },
            { label: 'Assignments', href: '/training/assignments', icon: '📝' },
            { label: 'Videos', href: '/training/videos', icon: '🎬' },
            { label: 'Sessions', href: '/training/sessions', icon: '💻' },
            { label: 'Feedback', href: '/training/feedback', icon: '💬' },
            { label: 'Violations', href: '/training/violations', icon: '⚠️' },
        ],
    },
    {
        title: 'Placement',
        roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
        items: [
            { label: 'Jobs', href: '/placement/jobs', icon: '💼', roles: ['SUPER_ADMIN', 'ADMIN'] },
            { label: 'Assessments', href: '/placement/assessments', icon: '📝' },
            { label: 'Mock Interviews', href: '/placement/mock-interviews', icon: '🎤' },
            { label: 'Practice', href: '/placement/practice', icon: '🗣️' },
            { label: 'Reports', href: '/placement/reports', icon: '📈', roles: ['SUPER_ADMIN', 'ADMIN'] },
        ],
    },
    {
        title: 'Student Portal',
        roles: ['STUDENT'],
        items: [
            { label: 'My Courses', href: '/student/courses', icon: '📚' },
            { label: 'My Profile', href: '/student/profile', icon: '👤' },
            { label: 'Attendance', href: '/student/attendance', icon: '✅' },
            { label: 'Work Hour', href: '/student/time-tracking', icon: '⏱️' },
            { label: 'Apply Leave', href: '/student/leaves', icon: '🗓️' },
            { label: 'Assessments', href: '/student/assessments', icon: '📝' },
            { label: 'Job Board', href: '/student/jobs', icon: '💼' },
            { label: 'Integrity / Warnings', href: '/student/violations', icon: '⚠️' },
        ],
    },
    {
        title: 'System',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        items: [
            { label: 'Users', href: '/admin/users', icon: '👤', roles: ['SUPER_ADMIN'] },
            { label: 'Integrity Reports', href: '/reports', icon: '⚠️' },
            { label: 'Notifications', href: '/notifications', icon: '🔔' },
            { label: 'Settings', href: '/settings', icon: '⚙️' },
        ],
    },
];

const roleColors: Record<string, string> = {
    SUPER_ADMIN: '#6366f1',
    ADMIN: '#6366f1',
    TRAINER: '#10b981',
    MARKETER: '#f59e0b',
    STUDENT: '#06b6d4',
};

import React from 'react';

export default function Sidebar({ userRole, userName, userEmail, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const accentColor = roleColors[userRole] || '#6366f1';

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Auto-close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatRole = (role: string) => {
        return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const handleLogout = () => {
        clearToken();
        router.push('/');
    };

    return (
        <>
            <div className={`sidebar-overlay${isOpen ? ' visible' : ''}`} onClick={onClose} />
            <aside className={`sidebar${isOpen ? ' open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-logo" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>A</div>
                    <div className="sidebar-brand-text">
                        <h2>Apptech Careers</h2>
                        <span>Learning Management</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navSections
                        .filter((section) => section.roles.includes(userRole))
                        .map((section) => (
                            <div className="sidebar-section" key={section.title}>
                                <div className="sidebar-section-title">{section.title}</div>
                                {section.items
                                    .filter((item) => !item.roles || item.roles.includes(userRole))
                                    .map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                                            style={pathname === item.href || pathname.startsWith(item.href + '/') ? { background: `${accentColor}18`, color: accentColor } : {}}
                                            onClick={onClose}
                                        >
                                            <span className="link-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                            </div>
                        ))}
                </nav>

                <div className="sidebar-user" style={{ flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}>{getInitials(userName)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{userName}</div>
                            <div className="sidebar-user-role">{formatRole(userRole)}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-family)',
                    }}>
                        Sign Out
                    </button>
                </div>
            </aside >

            {/* Mobile Bottom Navigation Bar */}
            <div className="mobile-bottom-nav">
                {navSections
                    .filter((section) => section.roles.includes(userRole))
                    .flatMap(s => s.items)
                    .filter(item => !item.roles || item.roles.includes(userRole))
                    .slice(0, 4) // Show only primary 4 items on bottom bar
                    .map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`bottom-nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                            style={pathname === item.href || pathname.startsWith(item.href + '/') ? { color: accentColor } : {}}
                        >
                            <span className="bottom-nav-icon">{item.icon}</span>
                            <span className="bottom-nav-label">{item.label}</span>
                        </Link>
                    ))}
                <button className="bottom-nav-item" onClick={() => setIsMobileMenuOpen(true)}>
                    <span className="bottom-nav-icon">☰</span>
                    <span className="bottom-nav-label">Menu</span>
                </button>
            </div>

            {/* Mobile Full Screen Menu Overlay */}
            <div className={`mobile-full-menu ${isMobileMenuOpen ? 'visible' : ''}`}>
                <div className="mobile-menu-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}>{getInitials(userName)}</div>
                        <div>
                            <div className="sidebar-user-name" style={{ fontSize: '14px' }}>{userName}</div>
                            <div className="sidebar-user-role" style={{ fontSize: '12px' }}>{formatRole(userRole)}</div>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: '16px', overflowY: 'auto', height: 'calc(100vh - 140px)' }}>
                    {navSections
                        .filter((section) => section.roles.includes(userRole))
                        .map((section) => (
                            <div key={section.title} style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>{section.title}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {section.items
                                        .filter((item) => !item.roles || item.roles.includes(userRole))
                                        .map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                    background: 'var(--bg-tertiary)', padding: '16px 12px', borderRadius: '12px',
                                                    border: pathname === item.href || pathname.startsWith(item.href + '/') ? `1px solid ${accentColor}55` : '1px solid var(--border)',
                                                    color: pathname === item.href || pathname.startsWith(item.href + '/') ? accentColor : 'var(--text-primary)',
                                                    textDecoration: 'none', fontSize: '13px', fontWeight: 500
                                                }}
                                            >
                                                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                                                <span style={{ textAlign: 'center' }}>{item.label}</span>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        ))}
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: '12px', borderRadius: '12px',
                        background: 'var(--gradient-danger)', color: 'white', fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer', border: 'none'
                    }}>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
