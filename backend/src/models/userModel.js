import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password']
  },
  profile: {
    personalDetails: {
      phone: String,
      address: String,
      website: String,
      linkedIn: String,
      github: String
    },
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      description: String
    }],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String
    }],
    skills: [String],
    certifications: [{
      name: String,
      issuer: String,
      date: Date
    }],
    achievements: [String]
  }
}, { timestamps: true });

// Only compile model if it hasn't been compiled before
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 