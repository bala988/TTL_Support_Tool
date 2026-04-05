import mongoose from 'mongoose';

const regularizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MongoUser',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD — the day being regularized
      required: true,
    },
    requestedPunchIn: {
      type: String, // HH:mm (24-hour format)
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'],
    },
    requestedPunchOut: {
      type: String, // HH:mm (24-hour format)
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'],
    },
    totalMinutes: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
    },
    workDescription: {
      type: String,
      required: [true, 'Work description is required'],
      trim: true,
      minlength: [10, 'Work description must be at least 10 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminComment: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MongoUser',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total minutes before saving
regularizationSchema.pre('save', function (next) {
  if (this.isModified('requestedPunchIn') || this.isModified('requestedPunchOut')) {
    const [fromH, fromM] = this.requestedPunchIn.split(':').map(Number);
    const [toH, toM] = this.requestedPunchOut.split(':').map(Number);
    const fromTotal = fromH * 60 + fromM;
    const toTotal = toH * 60 + toM;
    this.totalMinutes = toTotal - fromTotal;

    if (this.totalMinutes <= 0) {
      return next(new Error('Punch out time must be after punch in time'));
    }
  }
  next();
});

// One pending regularization per user per day
regularizationSchema.index({ userId: 1, date: 1, status: 1 });
regularizationSchema.index({ userId: 1, createdAt: -1 });

const Regularization = mongoose.model('Regularization', regularizationSchema);

export default Regularization;
