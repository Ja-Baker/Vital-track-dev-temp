import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children, facilityId }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!facilityId) return;

    const newSocket = io({
      path: '/socket.io',
      auth: { token: api.getToken() },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      newSocket.emit('join-facility', facilityId);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [facilityId]);

  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;
