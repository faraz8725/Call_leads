import mongoose from 'mongoose';

const callRecordingSchema = new mongoose.Schema(
  {
    call: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
      required: true,
      index: true
    },
    recordingUrl: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 0 // Duration in seconds
    },
    fileSize: {
      type: Number,
      default: 0
    },
    format: {
      type: String,
      default: 'audio/mp3'
    },
    providerCallId: {
      type: String
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'ready'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('CallRecording', callRecordingSchema);
