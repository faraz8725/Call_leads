import { Server } from 'socket.io';
import { env } from './env.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`🔌 WebSocket Client Connected: ${socket.id}`);

    // Join specific rooms
    socket.on('join:live_calls', () => {
      socket.join('live_calls');
      console.log(`Socket ${socket.id} joined live_calls room`);
    });

    socket.on('leave:live_calls', () => {
      socket.leave('live_calls');
    });

    socket.on('join:campaign', (campaignId) => {
      socket.join(`campaign_${campaignId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket Client Disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

// Real-time broadcast helpers
export const emitLiveCallUpdate = (callData) => {
  if (ioInstance) {
    ioInstance.to('live_calls').emit('call:update', callData);
    ioInstance.emit('call:live_feed', callData);
  }
};

export const emitCallEvent = (eventType, payload) => {
  if (ioInstance) {
    ioInstance.emit(`call:${eventType}`, payload);
  }
};

export const emitCampaignProgress = (campaignId, progressData) => {
  if (ioInstance) {
    ioInstance.to(`campaign_${campaignId}`).emit('campaign:progress', progressData);
    ioInstance.emit('campaign:global_progress', { campaignId, ...progressData });
  }
};

export const emitNotification = (notification) => {
  if (ioInstance) {
    ioInstance.emit('system:notification', {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...notification
    });
  }
};
