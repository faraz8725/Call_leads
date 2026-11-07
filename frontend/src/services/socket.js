import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected to backend:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
    });
  }
  return socketInstance;
};
