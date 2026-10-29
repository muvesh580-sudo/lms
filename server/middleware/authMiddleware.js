import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Resolve the user for a Bearer token, or null if the token is missing/invalid
const getUserFromRequest = async (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return { user: null, reason: 'Not authorized, no token' };
  }

  const token = header.split(' ')[1];
  if (!token) {
    return { user: null, reason: 'Not authorized, no token' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // Media tokens are only valid for streaming files, never as a login token
    if (decoded.purpose) {
      return { user: null, reason: 'Not authorized, token failed' };
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return { user: null, reason: 'Not authorized, user not found' };
    }
    return { user };
  } catch {
    return { user: null, reason: 'Not authorized, token failed' };
  }
};

// Protect routes - Authentication middleware
export const protect = async (req, res, next) => {
  const { user, reason } = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: reason });
  }
  req.user = user;
  next();
};

// Attach the user if a valid token is present, but allow anonymous access
export const optionalAuth = async (req, res, next) => {
  const { user } = await getUserFromRequest(req);
  if (user) {
    req.user = user;
  }
  next();
};

// Role authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
