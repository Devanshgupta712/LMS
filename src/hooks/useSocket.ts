'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '@/lib/api';

export const useSocket = (batchId: string | null, onViolation?: (data: any) => void, onUnlock?: (data: any) => void) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!batchId) return;

        // Ensure we connect to the right base URL (remove /api if needed)
        const socketUrl = API_BASE.replace('/api', '');
        
        const socket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('WS Connected');
            socket.emit('join_batch', batchId);
        });

        socket.on('violation_alert', (data) => {
            console.log('Violation Alert:', data);
            if (onViolation) onViolation(data);
        });

        socket.on('task_unlocked', (data) => {
            console.log('Task Unlocked:', data);
            if (onUnlock) onUnlock(data);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [batchId]);

    return socketRef.current;
};
