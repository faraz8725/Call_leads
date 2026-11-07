import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_voice_calling_platform',
  JWT_SECRET: process.env.JWT_SECRET || 'ai_voice_platform_super_secret_jwt_key_2026_xyz',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Groq LLM API
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Deepgram Speech-To-Text
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || '',

  // Sarvam AI Text-To-Speech
  SARVAM_API_KEY: process.env.SARVAM_API_KEY || '',

  // LiveKit WebRTC / Real-Time Voice Infrastructure
  LIVEKIT_URL: process.env.LIVEKIT_URL || '',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || '',
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || '',

  // Vobiz Outbound Telephony Provider
  VOBIZ_API_KEY: process.env.VOBIZ_API_KEY || '',
  VOBIZ_API_SECRET: process.env.VOBIZ_API_SECRET || '',
  VOBIZ_BASE_URL: process.env.VOBIZ_BASE_URL || 'https://api.vobiz.ai/v1',
  VOBIZ_PHONE_NUMBER: process.env.VOBIZ_PHONE_NUMBER || '+18005550199',

  // Frontend URL for CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

/**
 * Validates configuration at server boot and logs clear status warnings.
 */
export const validateConfig = () => {
  console.log('----------------------------------------------------');
  console.log('⚡ AI Voice Calling SaaS Platform - Startup Config Check');
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔌 Port: ${env.PORT}`);
  console.log(`🗄️  MongoDB URI: ${env.MONGODB_URI.replace(/\/\/.*@/, '//<redacted>@')}`);

  const integrations = [
    { name: 'Groq LLM', key: env.GROQ_API_KEY, info: 'LLM reasoning and intent classification' },
    { name: 'Deepgram STT', key: env.DEEPGRAM_API_KEY, info: 'Speech-to-text transcription' },
    { name: 'Sarvam AI TTS', key: env.SARVAM_API_KEY, info: 'Hindi/English text-to-speech' },
    { name: 'LiveKit Voice', key: env.LIVEKIT_URL && env.LIVEKIT_API_KEY, info: 'Real-time WebRTC audio streams' },
    { name: 'Vobiz Telephony', key: env.VOBIZ_API_KEY, info: 'Outbound carrier calling & SIP' }
  ];

  integrations.forEach(({ name, key, info }) => {
    if (key) {
      console.log(`  [OK] ${name}: Configured (${info})`);
    } else {
      console.log(`  [NOTE] ${name}: Key not present in .env. Service adapter will run in mock/simulation mode with full fallback capabilities until credentials are provided in Integrations.`);
    }
  });
  console.log('----------------------------------------------------');
};
