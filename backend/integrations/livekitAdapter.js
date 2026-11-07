import { RoomServiceClient, AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import { env } from '../config/env.js';

class LiveKitAdapter {
  constructor() {
    this.host = env.LIVEKIT_URL;
    this.apiKey = env.LIVEKIT_API_KEY;
    this.apiSecret = env.LIVEKIT_API_SECRET;
    this.roomService = null;
    this.webhookReceiver = null;

    if (this.host && this.apiKey && this.apiSecret) {
      try {
        this.roomService = new RoomServiceClient(this.host, this.apiKey, this.apiSecret);
        this.webhookReceiver = new WebhookReceiver(this.apiKey, this.apiSecret);
      } catch (err) {
        console.error('LiveKit client init error:', err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(this.host && this.apiKey && this.apiSecret);
  }

  setCredentials(host, apiKey, apiSecret) {
    this.host = host;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    if (host && apiKey && apiSecret) {
      this.roomService = new RoomServiceClient(host, apiKey, apiSecret);
      this.webhookReceiver = new WebhookReceiver(apiKey, apiSecret);
    }
  }

  /**
   * Generates a secure JWT token for a participant or AI agent to connect to a LiveKit audio room
   */
  generateParticipantToken({
    roomName,
    participantIdentity,
    participantName,
    metadata = {},
    isAgent = false
  }) {
    if (!this.isConfigured()) {
      return `simulated_token_room_${roomName}_${participantIdentity}`;
    }

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      metadata: JSON.stringify(metadata),
      ttl: '2h'
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isAgent
    });

    return at.toJwt();
  }

  /**
   * Creates an active voice session room
   */
  async createRoom({ roomName, emptyTimeout = 300, maxParticipants = 4 }) {
    if (!this.isConfigured() || !this.roomService) {
      return {
        name: roomName,
        sid: `sim_room_${Date.now()}`,
        status: 'active',
        source: 'simulated'
      };
    }

    try {
      const room = await this.roomService.createRoom({
        name: roomName,
        emptyTimeout,
        maxParticipants
      });
      return room;
    } catch (error) {
      console.error('LiveKit createRoom error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnects / deletes a voice session room
   */
  async deleteRoom(roomName) {
    if (!this.isConfigured() || !this.roomService) {
      return { success: true, message: 'Simulated room ended' };
    }

    try {
      await this.roomService.deleteRoom(roomName);
      return { success: true };
    } catch (error) {
      console.error('LiveKit deleteRoom error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validates webhook signature from LiveKit
   */
  verifyWebhook(bodyString, authHeader) {
    if (!this.isConfigured() || !this.webhookReceiver) {
      return null;
    }

    try {
      return this.webhookReceiver.receive(bodyString, authHeader);
    } catch (err) {
      console.error('LiveKit webhook validation failed:', err.message);
      return null;
    }
  }

  /**
   * Test LiveKit API connectivity
   */
  async testConnection() {
    if (!this.isConfigured() || !this.roomService) {
      return {
        success: false,
        message: 'LiveKit URL, API Key or API Secret is missing.'
      };
    }

    try {
      const rooms = await this.roomService.listRooms();
      return {
        success: true,
        message: `Connected successfully to LiveKit Server. Active rooms: ${rooms.length}`
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export const livekitAdapter = new LiveKitAdapter();
export default livekitAdapter;
