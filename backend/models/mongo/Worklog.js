import mongoose from 'mongoose';

const worklogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MongoUser', // Updated ref
      required: true,
    },
    date: {
      type: String, // Store as YYYY-MM-DD string
      required: true,
    },
    fromTime: {
      type: String, // Store as HH:mm string (24-hour format)
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'],
    },
    toTime: {
      type: String, // Store as HH:mm string (24-hour format)
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm'],
    },
    activity: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
      minlength: [5, 'Activity description must be at least 5 characters'],
    },
    customerName: {
      type: String,
      default: null,
      trim: true,
    },
    ticketId: {
      type: String,
      default: null,
      trim: true,
    },
    durationMinutes: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate duration before saving
worklogSchema.pre('save', function (next) {
  const [fromHours, fromMinutes] = this.fromTime.split(':').map(Number);
  const [toHours, toMinutes] = this.toTime.split(':').map(Number);
  
  const fromTotalMinutes = fromHours * 60 + fromMinutes;
  const toTotalMinutes = toHours * 60 + toMinutes;
  
  this.durationMinutes = toTotalMinutes - fromTotalMinutes;
  
  if (this.durationMinutes <= 0) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

// Index for faster queries
worklogSchema.index({ userId: 1, date: 1 });

const Worklog = mongoose.model('Worklog', worklogSchema);

export default Worklog;
