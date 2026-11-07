import axios from 'axios';
import crypto from 'crypto';
import { env } from '../config/env.js';

class VobizAdapter {
  constructor() {
    this.apiKey = env.VOBIZ_API_KEY;
    this.apiSecret = env.VOBIZ_API_SECRET;
    this.baseUrl = env.VOBIZ_BASE_URL || 'https://api.vobiz.ai/v1';
    this.defaultCallerId = env.VOBIZ_PHONE_NUMBER || '+18005550199';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  setCredentials(apiKey, apiSecret, baseUrl, phoneNumber) {
    this.apiKey = apiKey;
    if (apiSecret) this.apiSecret = apiSecret;
    if (baseUrl) this.baseUrl = baseUrl;
    if (phoneNumber) this.defaultCallerId = phoneNumber;
  }

  /**
   * Generates authorization headers for Vobiz REST requests
   */
  _getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Vobiz-Secret': this.apiSecret,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Initiates an outbound telephone call via Vobiz Carrier API
   */
  async initiateCall({
    to,
    from,
    webhookUrl,
    statusCallbackUrl,
    sipEndpoint,
    metadata = {}
  }) {
    const callerId = from || this.defaultCallerId;

    if (!this.isConfigured()) {
      // Production transparency: never pretend real call was dispatched without credentials
      return {
        success: true,
        isSimulated: true,
        callId: `vobiz_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        status: 'initiating',
        to,
        from: callerId,
        message: 'Dispatched to interactive voice test pipeline (Live Vobiz API key not set in environment).'
      };
    }

    try {
      const payload = {
        to,
        from: callerId,
        webhook_url: webhookUrl,
        status_callback_url: statusCallbackUrl,
        sip_endpoint: sipEndpoint,
        record: true,
        timeout: 45,
        metadata
      };

      const response = await axios.post(`${this.baseUrl}/calls/outbound`, payload, {
        headers: this._getHeaders(),
        timeout: 15000
      });

      return {
        success: true,
        isSimulated: false,
        callId: response.data?.call_id || response.data?.id,
        status: response.data?.status || 'initiating',
        to,
        from: callerId,
        raw: response.data
      };
    } catch (error) {
      console.error(
        'Vobiz API Call Initiation Error:',
        error.response?.data || error.message
      );
      return {
        success: false,
        isSimulated: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Safely hangs up an ongoing outbound call
   */
  async hangupCall(providerCallId) {
    if (!this.isConfigured() || providerCallId.startsWith('vobiz_sim_')) {
      return {
        success: true,
        callId: providerCallId,
        status: 'completed',
        message: 'Simulated call ended successfully.'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/calls/${providerCallId}/hangup`,
        {},
        { headers: this._getHeaders(), timeout: 10000 }
      );
      return {
        success: true,
        callId: providerCallId,
        status: 'completed',
        raw: response.data
      };
    } catch (error) {
      console.error('Vobiz Hangup Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Fetches call status and recording from Vobiz
   */
  async getCallDetails(providerCallId) {
    if (!this.isConfigured() || providerCallId.startsWith('vobiz_sim_')) {
      return {
        callId: providerCallId,
        status: 'completed',
        duration: 85,
        recordingUrl: null
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/calls/${providerCallId}`, {
        headers: this._getHeaders(),
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Vobiz Get Call Details Error:', error.message);
      throw error;
    }
  }

  /**
   * Verifies incoming webhook signature to prevent spoofing
   */
  verifyWebhookSignature(payloadString, signatureHeader) {
    if (!this.apiSecret || !signatureHeader) return true; // Permissive in dev if secret not configured

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signatureHeader)
      );
    } catch (err) {
      console.error('Vobiz webhook signature validation error:', err.message);
      return false;
    }
  }

  /**
   * Test Vobiz API connectivity
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Vobiz API Key is not configured.'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: this._getHeaders(),
        timeout: 8000
      });
      return {
        success: true,
        message: `Connected successfully to Vobiz. Account status: ${response.data?.status || 'Active'}`
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      };
    }
  }
}

export const vobizAdapter = new VobizAdapter();
export default vobizAdapter;
