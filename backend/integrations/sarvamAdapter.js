import axios from 'axios';
import { env } from '../config/env.js';

class SarvamAdapter {
  constructor() {
    this.apiKey = env.SARVAM_API_KEY;
    this.baseUrl = 'https://api.sarvam.ai';
    this.defaultVoice = 'meera';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Generates audio from text using Sarvam AI Bulbul TTS API
   * Supported languages: 'hi-IN', 'en-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN', 'gu-IN'
   * Supported voices: meera, pavithra, maitri, arvind, amol, amartya, etc.
   */
  async synthesizeSpeech({
    text,
    languageCode = 'en-IN',
    speaker = 'meera',
    pace = 1.0,
    pitch = 0.0,
    sampleRate = 16000
  }) {
    if (!this.isConfigured()) {
      return {
        audioBase64: null,
        audioUrl: '/audio/sample-voice-response.mp3',
        format: 'audio/wav',
        durationEstimate: Math.max(2, Math.round(text.split(' ').length / 2.5)),
        source: 'simulated_sarvam'
      };
    }

    try {
      // Map simplified lang code to Sarvam format
      let targetLang = 'en-IN';
      if (languageCode === 'hi') targetLang = 'hi-IN';
      if (languageCode === 'hi-en') targetLang = 'hi-IN'; // Sarvam handles code-mixed Hinglish in hi-IN/en-IN models

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech`,
        {
          inputs: [text.slice(0, 500)], // API limit per chunk
          target_language_code: targetLang,
          speaker: speaker || this.defaultVoice,
          pitch: pitch,
          pace: pace,
          loudness: 1.5,
          speech_sample_rate: sampleRate,
          enable_preprocessing: true,
          model: 'bulbul:v1'
        },
        {
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const audios = response.data?.audios || [];
      const primaryAudioBase64 = audios[0] || '';

      return {
        audioBase64: primaryAudioBase64,
        audioBuffer: primaryAudioBase64 ? Buffer.from(primaryAudioBase64, 'base64') : null,
        format: 'audio/wav',
        durationEstimate: Math.max(2, Math.round(text.split(' ').length / 2.5)),
        source: 'sarvam'
      };
    } catch (error) {
      console.error(
        'Sarvam AI TTS error:',
        error.response?.data?.message || error.message
      );
      // Fallback gracefully so calls do not crash
      return {
        audioBase64: null,
        audioUrl: '/audio/sample-voice-response.mp3',
        format: 'audio/wav',
        durationEstimate: Math.max(2, Math.round(text.split(' ').length / 2.5)),
        source: 'sarvam_fallback',
        error: error.message
      };
    }
  }

  /**
   * Test Sarvam AI API connectivity
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Sarvam AI API Key is not configured.'
      };
    }

    try {
      const result = await this.synthesizeSpeech({
        text: 'Namaste, this is a test from the AI calling platform.',
        languageCode: 'en-IN',
        speaker: 'meera'
      });

      if (result.audioBase64) {
        return {
          success: true,
          message: 'Connected successfully to Sarvam AI Bulbul TTS. Voice synthesis verified.'
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to synthesize test audio.'
        };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export const sarvamAdapter = new SarvamAdapter();
export default sarvamAdapter;
