import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import ActivityLog from '../models/ActivityLog.js';
import { env } from '../config/env.js';

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin and get token
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact platform owner.'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    // Record login activity
    await ActivityLog.create({
      admin: admin._id,
      action: 'LOGIN',
      entityType: 'System',
      description: `Admin ${admin.name} (${admin.email}) logged in successfully.`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in admin details
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Log out admin
 */
export const logout = async (req, res, next) => {
  try {
    if (req.admin) {
      await ActivityLog.create({
        admin: req.admin._id,
        action: 'LOGOUT',
        entityType: 'System',
        description: `Admin ${req.admin.name} logged out.`,
        ipAddress: req.ip
      });
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update admin profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const admin = await Admin.findById(req.admin._id);

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();
    if (avatar) admin.avatar = avatar;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Forgot password flow
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin registered with that email address.'
      });
    }

    // In a production setup this sends a reset link; for self-contained deployment we provide instant assistance
    res.status(200).json({
      success: true,
      message: 'A password reset verification email has been simulated. For default local development, use credentials admin@voicecall.ai / Admin@12345.'
    });
  } catch (error) {
    next(error);
  }
};
