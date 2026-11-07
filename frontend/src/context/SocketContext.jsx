import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket.js';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [liveCalls, setLiveCalls] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.emit('join:live_calls');

    s.on('call:update', (updatedCall) => {
      setLiveCalls((prev) => {
        const index = prev.findIndex((c) => c._id === updatedCall._id);
        if (index >= 0) {
          if (['completed', 'failed', 'rejected', 'busy', 'no-answer'].includes(updatedCall.status)) {
            // Remove after short delay or replace
            return prev.map((c) => (c._id === updatedCall._id ? updatedCall : c));
          }
          const updated = [...prev];
          updated[index] = updatedCall;
          return updated;
        } else {
          return [updatedCall, ...prev];
        }
      });
    });

    s.on('system:notification', (notif) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
    });

    return () => {
      s.off('call:update');
      s.off('system:notification');
    };
  }, []);

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        liveCalls,
        setLiveCalls,
        notifications,
        clearNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
