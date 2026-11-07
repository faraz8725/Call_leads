import mongoose from 'mongoose';

const integrationSettingsSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['groq', 'deepgram', 'sarvam', 'livekit', 'vobiz'],
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['llm', 'stt', 'tts', 'webrtc', 'telephony'],
      required: true
    },
    config: {
      type: Map,
      of: String,
      default: {}
    },
    isConfigured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastTestedAt: {
      type: Date
    },
    lastTestStatus: {
      type: String,
      enum: ['untested', 'success', 'failed'],
      default: 'untested'
    },
    lastTestMessage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('IntegrationSettings', integrationSettingsSchema);
