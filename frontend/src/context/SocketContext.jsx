import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef    = useRef(null);
  const [socket,       setSocket]      = useState(null);   // ← FIX: store in state
  const [isConnected,  setIsConnected] = useState(false);

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = s;
    setSocket(s);                                          // ← FIX: triggers re-render so
                                                           //   consumers get the real socket

    s.on('connect',    () => { setIsConnected(true);  console.log('✅ Socket connected:', s.id); });
    s.on('disconnect', () => { setIsConnected(false); console.log('❌ Socket disconnected'); });

    return () => { s.disconnect(); };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);