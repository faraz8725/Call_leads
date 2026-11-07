import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      enum: ['Lead', 'Campaign', 'Call', 'AIAgent', 'KnowledgeBase', 'Integration', 'System'],
      required: true
    },
    entityId: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
