import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; // Changed from bcryptjs to bcrypt (main app uses bcrypt)

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true, // Need to make sure this doesn't conflict if not syncing perfectly
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String, // Store as base64 string
    },
    homeAddress: String,
    aadharNumber: String,
    panNumber: String,
    bloodGroup: String,
    emergencyContact: String,
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['employee', 'admin', 'sales'], // Added sales to match main app
      default: 'employee',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = await this.model('User').findById(this._id).select('+passwordHash');
  return await bcrypt.compare(candidatePassword, user.passwordHash);
};

// Remove passwordHash from JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('MongoUser', userSchema); // Renamed model to avoid confusion in Mongoose registry

export default User;
