import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Running', 'Paused', 'Completed', 'Stopped'],
      default: 'Draft',
      index: true
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAgent',
      required: [true, 'AI Agent must be assigned to campaign']
    },
    leads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
      }
    ],
    script: {
      type: String,
      default: 'Introduce the value proposition, ask qualifying questions, handle objections, and secure interest or schedule a callback.'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'hi-en'],
      default: 'en'
    },
    voiceId: {
      type: String,
      default: 'meera'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    callingHoursStart: {
      type: String,
      default: '09:00' // 24-hr format HH:MM
    },
    callingHoursEnd: {
      type: String,
      default: '19:00' // 24-hr format HH:MM
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    retryIntervalMinutes: {
      type: Number,
      default: 60,
      min: 5
    },
    concurrencyLimit: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    stats: {
      totalLeads: { type: Number, default: 0 },
      processedLeads: { type: Number, default: 0 },
      pendingLeads: { type: Number, default: 0 },
      inProgressCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      failedCalls: { type: Number, default: 0 },
      answeredCalls: { type: Number, default: 0 },
      noAnswerCalls: { type: Number, default: 0 },
      busyCalls: { type: Number, default: 0 },
      interestedCount: { type: Number, default: 0 },
      notInterestedCount: { type: Number, default: 0 },
      callbackCount: { type: Number, default: 0 },
      humanHandoffCount: { type: Number, default: 0 },
      totalDurationSeconds: { type: Number, default: 0 }
    },
    scheduledAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
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

export default mongoose.model('Campaign', campaignSchema);
