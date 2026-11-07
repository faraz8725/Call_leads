import { createClient } from '@deepgram/sdk';
import { env } from '../config/env.js';

class DeepgramAdapter {
  constructor() {
    this.apiKey = env.DEEPGRAM_API_KEY;
    this.client = null;

    if (this.apiKey) {
      try {
        this.client = createClient(this.apiKey);
      } catch (err) {
        console.error('Deepgram client init error:', err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  setApiKey(key) {
    this.apiKey = key;
    if (key) {
      this.client = createClient(key);
    }
  }

  /**
   * Transcribes a pre-recorded audio buffer or stream
   */
  async transcribeAudioBuffer(buffer, mimetype = 'audio/wav', language = 'en') {
    if (!this.isConfigured() || !this.client) {
      return {
        text: 'Hello, I received your call. Can you explain what this is about?',
        confidence: 0.98,
        words: [],
        source: 'simulated_stt'
      };
    }

    try {
      const response = await this.client.listen.prerecorded.transcribeFile(buffer, {
        mimetype,
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        language: language === 'hi' ? 'hi' : 'en-US'
      });

      const transcript =
        response.result?.results?.channels[0]?.alternatives[0]?.transcript || '';
      const confidence =
        response.result?.results?.channels[0]?.alternatives[0]?.confidence || 0.9;

      return {
        text: transcript.trim(),
        confidence,
        raw: response.result,
        source: 'deepgram'
      };
    } catch (error) {
      console.error('Deepgram transcription error:', error.message);
      throw error;
    }
  }

  /**
   * Generates configuration for Live streaming connection (WebSockets / LiveKit bridge)
   */
  getLiveTranscriptionConfig(language = 'en') {
    return {
      model: 'nova-2',
      interim_results: true,
      smart_format: true,
      endpointing: 300,
      language: language === 'hi' ? 'hi' : 'en-US'
    };
  }

  /**
   * Test Deepgram API connectivity
   */
  async testConnection() {
    if (!this.isConfigured() || !this.client) {
      return {
        success: false,
        message: 'Deepgram API Key is not configured.'
      };
    }

    try {
      // Test key by requesting project balance or info
      const { result, error } = await this.client.manage.getProjects();
      if (error) {
        return { success: false, message: error.message };
      }
      return {
        success: true,
        message: `Connected successfully to Deepgram. Projects found: ${result.projects?.length || 0}`
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export const deepgramAdapter = new DeepgramAdapter();
export default deepgramAdapter;
