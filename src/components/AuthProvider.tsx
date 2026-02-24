'use client';

import AppLayout from '@/components/AppLayout';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    return <AppLayout>{children}</AppLayout>;
}
