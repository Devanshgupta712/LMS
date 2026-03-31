'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';
import React from 'react';

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
        title: 'Main',
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
        title: 'Academy',
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
        title: 'Training Hub',
        roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'MARKETER'],
        items: [
            { label: 'My Profile', href: '/student/profile', icon: '👤' },
            { label: 'Attendance', href: '/training/attendance', icon: '✅', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Work Hour', href: '/student/time-tracking', icon: '⏱️' },
            { label: 'Projects', href: '/training/projects', icon: '🏗️', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Tasks', href: '/training/tasks', icon: '📋', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Assignments', href: '/training/assignments', icon: '📝', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Videos', href: '/training/videos', icon: '🎬', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Sessions', href: '/training/sessions', icon: '💻', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Feedback', href: '/training/feedback', icon: '💬', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Violations', href: '/training/violations', icon: '⚠️', roles: ['SUPER_ADMIN', 'ADMIN', 'TRAINER'] },
            { label: 'Apply Leave', href: '/training/leaves', icon: '🗓️', roles: ['TRAINER'] },
        ],
    },
    {
        title: 'Career',
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
            { label: 'Warnings', href: '/student/violations', icon: '⚠️' },
        ],
    },
    {
        title: 'System',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        items: [
            { label: 'Users', href: '/admin/users', icon: '👤', roles: ['SUPER_ADMIN'] },
            { label: 'Security', href: '/reports', icon: '⚠️' },
            { label: 'Notifications', href: '/notifications', icon: '🔔' },
            { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
        ],
    },
];

export default function Sidebar({ userRole, userName, userEmail, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

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
            {/* Desktop Frosted Island Sidebar */}
            <aside className={`glass-premium ${isOpen ? 'open' : ''}`} style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                bottom: '20px',
                width: 'var(--sidebar-width)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                padding: '24px 12px',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid var(--border)',
                overflow: 'hidden'
            }}>
                {/* Branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px 24px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-premium)',
                        overflow: 'hidden',
                        padding: '4px'
                    }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>AppTechno Software</h2>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Training Engine</span>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="sidebar-nav">
                    {navSections
                        .filter((section) => section.roles.includes(userRole))
                        .map((section) => (
                            <div key={section.title} style={{ marginBottom: '24px' }}>
                                <div style={{ 
                                    padding: '0 12px', 
                                    fontSize: '11px', 
                                    fontWeight: 600, 
                                    color: 'var(--text-muted)', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.1em',
                                    marginBottom: '12px'
                                }}>
                                    {section.title}
                                </div>
                                {section.items
                                    .filter((item) => !item.roles || item.roles.includes(userRole))
                                    .map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`hover-lift ${isActive ? 'active' : ''}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '10px 12px',
                                                    borderRadius: '12px',
                                                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                                    background: isActive ? 'var(--primary)' : 'transparent',
                                                    fontWeight: isActive ? 700 : 500,
                                                    fontSize: '14px',
                                                    marginBottom: '4px',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isActive ? '0 10px 20px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.2)' : 'none'
                                                }}
                                                onClick={onClose}
                                            >
                                                <span style={{ fontSize: '18px', filter: isActive ? 'none' : 'grayscale(100%) opacity(0.7)' }}>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                            </div>
                        ))}
                </nav>

                {/* User Section */}
                <div style={{ marginTop: '20px', padding: '16px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: 'var(--primary-glow)', 
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}>
                            {getInitials(userName)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{userName}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{formatRole(userRole)}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="hover-lift" style={{
                        width: '100%', 
                        padding: '10px', 
                        borderRadius: '10px', 
                        color: '#ef4444', 
                        fontSize: '13px', 
                        fontWeight: 700,
                        border: '1px solid hsla(0, 80%, 60%, 0.1)',
                        background: 'hsla(0, 80%, 60%, 0.05)',
                        cursor: 'pointer', 
                        transition: 'all 0.2s',
                    }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation Bar - Enhanced */}
            <div className="mobile-bottom-nav glass-premium" style={{
                display: 'none',
                position: 'fixed',
                bottom: '16px',
                left: '16px',
                right: '16px',
                height: '64px',
                borderRadius: '20px',
                zIndex: 1000,
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
                {navSections
                    .filter((section) => section.roles.includes(userRole))
                    .flatMap(s => s.items)
                    .filter(item => !item.roles || item.roles.includes(userRole))
                    .slice(0, 4)
                    .map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '8px',
                                    borderRadius: '12px',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease',
                                    textDecoration: 'none'
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700 }}>{item.label}</span>
                            </Link>
                        );
                    })}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)'
                    }}
                >
                    <span style={{ fontSize: '20px' }}>☰</span>
                    <span style={{ fontSize: '10px', fontWeight: 700 }}>Menu</span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-full-menu ${isMobileMenuOpen ? 'visible' : ''}`} style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--bg-primary)',
                zIndex: 2000,
                transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '12px', 
                            background: 'var(--primary-glow)', 
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600
                        }}>
                            {getInitials(userName)}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '16px' }}>{userName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatRole(userRole)}</div>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--text-primary)', fontSize: '20px' }}>✕</button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {navSections
                        .filter((section) => section.roles.includes(userRole))
                        .map((section) => (
                            <div key={section.title} style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>{section.title}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {section.items
                                        .filter((item) => !item.roles || item.roles.includes(userRole))
                                        .map((item) => {
                                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: isActive ? 'var(--primary-glow)' : 'var(--bg-tertiary)',
                                                        padding: '16px',
                                                        borderRadius: '16px',
                                                        border: isActive ? '1px solid var(--primary-glow)' : '1px solid var(--border)',
                                                        color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                                                        fontSize: '13px',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    <span style={{ fontSize: '24px' }}>{item.icon}</span>
                                                    <span style={{ textAlign: 'center' }}>{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout} style={{
                        width: '100%', 
                        padding: '14px', 
                        borderRadius: '16px',
                        background: '#ef4444', 
                        color: 'white', 
                        fontSize: '15px', 
                        fontWeight: 700,
                        border: 'none'
                    }}>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
