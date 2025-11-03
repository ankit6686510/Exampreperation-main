import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';

export const useSocket = () => {
  const { user } = useAuth();
  const socketInitialized = useRef(false);

  useEffect(() => {
    if (user && !socketInitialized.current) {
      const token = localStorage.getItem('token');
      if (token) {
        initializeSocket(token);
        socketInitialized.current = true;
      }
    }

    return () => {
      if (socketInitialized.current) {
        disconnectSocket();
        socketInitialized.current = false;
      }
    };
  }, [user]);

  return getSocket();
};