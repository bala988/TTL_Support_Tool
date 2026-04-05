import mongoose from 'mongoose';

const punchClockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MongoUser',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    punchIn: {
      type: Date,
      required: true,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    totalMinutes: {
      type: Number,
      default: 0,
    },
    workLocation: {
      type: String,
      enum: ['Work from Home', 'Office', 'Client'],
      required: true,
    },
    missedPunchOut: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One punch record per user per day
punchClockSchema.index({ userId: 1, date: 1 }, { unique: true });

const PunchClock = mongoose.model('PunchClock', punchClockSchema);

export default PunchClock;
