import mongoose from 'mongoose';

const aiAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    personality: {
      type: String,
      default: 'Empathetic, articulate, and persuasive sales consultant'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'hi-en'],
      default: 'en'
    },
    voiceProvider: {
      type: String,
      enum: ['sarvam', 'livekit', 'deepgram', 'default'],
      default: 'sarvam'
    },
    voiceId: {
      type: String,
      default: 'meera' // Sarvam AI voice identifier: meera, pavithra, arvind, etc.
    },
    speakingStyle: {
      type: String,
      enum: ['Professional', 'Friendly', 'Assertive', 'Consultative', 'Conversational'],
      default: 'Professional'
    },
    speakingRate: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    systemPrompt: {
      type: String,
      required: [true, 'System prompt is required'],
      default: `You are an AI Voice Calling Assistant representing our enterprise.
Always introduce yourself clearly as an AI assistant.
Identify the purpose of your call immediately.
Be respectful of the recipient's time and ask for their consent to speak.
Never make false promises or invent unverified product claims.
If the recipient expresses disinterest or asks to end the call, politely thank them and end the call.
If the caller requests a real human agent, acknowledge politely and initiate handoff without faking that a human is already on the line.`
    },
    greetingMessage: {
      type: String,
      required: [true, 'Greeting message is required'],
      default: 'Hello! This is Maya, an AI assistant calling from Nexus Solutions. Am I speaking with {{lead_name}}?'
    },
    callObjectives: [
      {
        type: String
      }
    ],
    maxCallDuration: {
      type: Number,
      default: 300 // in seconds (5 minutes)
    },
    humanHandoffKeywords: {
      type: [String],
      default: ['human', 'manager', 'supervisor', 'real person', 'agent', 'executive', 'insaan', 'baat karwao']
    },
    optOutKeywords: {
      type: [String],
      default: ['stop calling', 'do not call', 'remove me', 'not interested', 'dnc', 'block', 'mat karo call']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('AIAgent', aiAgentSchema);
