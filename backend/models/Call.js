import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    providerCallId: {
      type: String,
      index: true
    },
    telephonyProvider: {
      type: String,
      enum: ['vobiz', 'livekit', 'simulator'],
      default: 'vobiz'
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      index: true
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAgent',
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    direction: {
      type: String,
      enum: ['outbound', 'inbound'],
      default: 'outbound'
    },
    status: {
      type: String,
      enum: [
        'initiating',
        'ringing',
        'connected',
        'in-progress',
        'completed',
        'busy',
        'no-answer',
        'failed',
        'rejected',
        'canceled'
      ],
      default: 'initiating',
      index: true
    },
    outcome: {
      type: String,
      enum: [
        'Pending',
        'Interested',
        'Not Interested',
        'Callback Requested',
        'Human Handoff Requested',
        'No Answer',
        'Busy',
        'Failed',
        'Completed'
      ],
      default: 'Pending',
      index: true
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    answerTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      default: 0 // Duration in seconds
    },
    customerIntent: {
      type: String,
      default: 'General Inquiry'
    },
    interestScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral'
    },
    objections: {
      type: [String],
      default: []
    },
    followUpDate: {
      type: Date
    },
    humanHandoffRequired: {
      type: Boolean,
      default: false,
      index: true
    },
    humanHandoffReason: {
      type: String,
      default: ''
    },
    recordingUrl: {
      type: String,
      default: ''
    },
    errorReason: {
      type: String,
      default: ''
    },
    liveSessionId: {
      type: String
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

callSchema.index({ status: 1, startTime: -1 });

export default mongoose.model('Call', callSchema);
