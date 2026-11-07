import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    company: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    customFields: {
      type: Map,
      of: String,
      default: {}
    },
    status: {
      type: String,
      enum: ['New', 'In Campaign', 'Called', 'Answered', 'Unreachable', 'Completed'],
      default: 'New',
      index: true
    },
    consentStatus: {
      type: Boolean,
      default: true // Opt-in tracking
    },
    consentDate: {
      type: Date,
      default: Date.now
    },
    consentSource: {
      type: String,
      default: 'Admin Import'
    },
    isDNC: {
      type: Boolean,
      default: false,
      index: true
    },
    attemptsCount: {
      type: Number,
      default: 0
    },
    lastCallDate: {
      type: Date
    },
    lastCallStatus: {
      type: String,
      default: 'Never Called'
    },
    lastCallOutcome: {
      type: String,
      enum: [
        'None',
        'Interested',
        'Not Interested',
        'Callback Requested',
        'Human Handoff Requested',
        'No Answer',
        'Busy',
        'Failed',
        'Completed'
      ],
      default: 'None'
    },
    interestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    notes: {
      type: String,
      default: ''
    },
    campaigns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for quick phone search and uniqueness per tenant/admin
leadSchema.index({ status: 1, isDNC: 1 });

export default mongoose.model('Lead', leadSchema);
