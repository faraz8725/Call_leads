import mongoose from 'mongoose';

const transcriptMessageSchema = new mongoose.Schema({
  speaker: {
    type: String,
    enum: ['ai', 'lead', 'system'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  durationMs: {
    type: Number,
    default: 0
  },
  audioUrl: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number,
    default: 0.95
  },
  intent: {
    type: String,
    default: ''
  }
});

const callTranscriptSchema = new mongoose.Schema(
  {
    call: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
      required: true,
      unique: true,
      index: true
    },
    messages: [transcriptMessageSchema],
    summary: {
      type: String,
      default: ''
    },
    keyTakeaways: [
      {
        type: String
      }
    ],
    actionItems: [
      {
        type: String
      }
    ],
    customerQuestions: [
      {
        type: String
      }
    ],
    rawSttOutput: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('CallTranscript', callTranscriptSchema);
