import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled Resume'
  },
  content: {
    type: String,
    required: true
  },
  template: {
    type: String,
    default: 'standard'
  },
  metrics: {
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    plagiarismScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    grammarScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  jobTitle: String,
  targetCompany: String,
  targetIndustry: String
}, { timestamps: true });

// Only compile model if it hasn't been compiled before
const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

export default Resume; 