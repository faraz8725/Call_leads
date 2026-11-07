import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Knowledge entry title is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['company', 'product', 'pricing', 'faq', 'services', 'sales', 'custom'],
      required: true,
      default: 'faq',
      index: true
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    keywords: [
      {
        type: String,
        trim: true
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 1
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

knowledgeBaseSchema.index({ category: 1, isActive: 1 });
knowledgeBaseSchema.index({ title: 'text', content: 'text', keywords: 'text' });

export default mongoose.model('KnowledgeBase', knowledgeBaseSchema);
