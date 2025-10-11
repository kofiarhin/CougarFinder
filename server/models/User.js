const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    ext: { type: String, required: true },
    paths: {
      public: { type: String, required: true },
      thumb: { type: String, required: true }
    },
    isPrimary: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const PresenceSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['offline', 'online', 'away'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now }
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'other'], required: true },
    orientation: { type: [String], default: [] },
    location: { type: LocationSchema, default: () => ({ coordinates: [0, 0] }) },
    profile: {
      bio: { type: String, default: '' },
      preferences: {
        minAge: { type: Number, default: 18 },
        maxAge: { type: Number, default: 99 },
        distance: { type: Number, default: 50 },
        genders: { type: [String], default: [] }
      }
    },
    presence: { type: PresenceSchema, default: () => ({}) },
    counters: {
      photoCount: { type: Number, default: 0 }
    },
    hasPrimary: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'banned', 'deleted'], default: 'active' },
    images: { type: [ImageSchema], default: [] }
  },
  { timestamps: true }
);

const applyUserIndexes = () => {
  const hasGeoIndex = UserSchema.indexes().some(([fields]) => fields.location === '2dsphere');
  if (!hasGeoIndex) {
    UserSchema.index({ location: '2dsphere' });
  }
};

applyUserIndexes();

const User = mongoose.model('User', UserSchema);

module.exports = {
  User,
  ImageSchema,
  applyUserIndexes
};
