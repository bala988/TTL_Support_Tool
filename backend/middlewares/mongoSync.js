import User from '../models/mongo/User.js';

export const syncMongoUser = async (req, res, next) => {
  try {
    // req.user is set by the MySQL auth middleware
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let mongoUser = await User.findOne({ email: req.user.email });

    if (!mongoUser) {
      // Create Mongo user if not exists
      // Map roles: main app 'admin' -> 'admin', 'engineer'/'sales' -> 'employee'
      const role = req.user.role === 'admin' ? 'admin' : 'employee';
      
      mongoUser = await User.create({
        fullName: req.user.name || 'User',
        email: req.user.email,
        employeeId: req.user.id ? `EMP-${req.user.id}` : req.user.email.split('@')[0].toUpperCase(),
        passwordHash: 'MERGED_USER', // Placeholder
        role: role,
      });
    } else {
      // Sync Employee ID if it doesn't match (e.g. legacy users or username-based IDs)
      if (req.user.id) {
        const expectedId = `EMP-${req.user.id}`;
        if (mongoUser.employeeId !== expectedId) {
          mongoUser.employeeId = expectedId;
          // Also sync name if changed
          if (req.user.name) mongoUser.fullName = req.user.name;
          await mongoUser.save();
        }
      }
    }

    req.mongoUser = mongoUser;
    next();
  } catch (error) {
    console.error('Mongo Sync Error:', error);
    res.status(500).json({ message: 'Error synchronizing user data' });
  }
};
