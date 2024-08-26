import User from '../models/user.js';
import {
  sendEmailOTP,
  sendPasswordResetEmail,
} from '../services/emailService.js';
import { generateOTP, isOTPValid } from '../services/otpService.js';
import { sendPhoneOTP } from '../services/phoneService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
  verifyToken,
} from '../services/tokenService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { errorHandler } from '../utils/errorHandler.js';
import {
  isStrongPassword,
  isValidEmail,
  isValidPhoneNumber,
} from '../utils/validators.js';

export const signup = async (req, res, next) => {
  const { email, name, password, phoneNumber, country, state } = req.body;

  if (!isValidEmail(email)) {
    return next(errorHandler(400, 'Invalid email'));
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return next(errorHandler(400, 'Invalid phone number'));
  }

  if (!isStrongPassword(password)) {
    return next(errorHandler(400, 'Password not strong enough'));
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      return next(errorHandler(400, 'Email already in use'));
    }
    if (existingUser.isPhoneVerified) {
      return next(errorHandler(400, 'Phone number already in use'));
    }
  }

  const emailOTP = generateOTP();
  const phoneOTP = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = new User({
    email,
    name,
    password,
    phoneNumber,
    country,
    state,
    emailOTP,
    phoneOTP,
    otpExpiry,
  });

  await user.save();

  await sendEmailOTP(email, emailOTP);
  await sendPhoneOTP(phoneNumber, phoneOTP);

  res
    .status(201)
    .json({ message: 'User created. Please verify your email and phone.' });
};

export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(errorHandler(404, 'User not found'));
  }

  if (user.isEmailVerified) {
    return next(errorHandler(400, 'Email already verified'));
  }

  if (!isOTPValid(user.emailOTP, otp, user.otpExpiry)) {
    return next(errorHandler(400, 'Invalid or expired OTP'));
  }

  user.isEmailVerified = true;
  user.emailOTP = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully' });
};

export const verifyPhone = async (req, res, next) => {
  const { phoneNumber, otp } = req.body;

  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return next(errorHandler(404, 'User not found'));
  }

  if (user.isPhoneVerified) {
    return next(errorHandler(400, 'Phone number already verified'));
  }

  if (!isOTPValid(user.phoneOTP, otp, user.otpExpiry)) {
    return next(errorHandler(400, 'Invalid or expired OTP'));
  }

  user.isPhoneVerified = true;
  user.phoneOTP = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.setHeader('Set-Cookie', [accessToken, refreshToken]);
  res.json({ message: 'Phone number verified successfully' });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return next(errorHandler(401, 'Invalid credentials'));
  }

  if (!user.isEmailVerified || !user.isPhoneVerified) {
    return next(errorHandler(403, 'Account not fully verified'));
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.setHeader('Set-Cookie', [accessToken, refreshToken]);
  res.json({ data: user, message: 'Login successful' });
};

export const refreshToken = async (req, res, next) => {
  const payload = await verifyRefreshToken(req);
  if (!payload) {
    return next(errorHandler(401, 'Invalid refresh token'));
  }

  const user = await User.findById(payload.userId);
  const accessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  res.setHeader('Set-Cookie', [accessToken, newRefreshToken]);
  res.json({ message: 'Access token refreshed' });
};

// Request password reset
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return next(errorHandler(400, 'Invalid email address'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    // We don't want to reveal whether a user exists or not
    return res.status(200).json({
      message:
        'If a user with that email exists, a password reset link has been sent.',
    });
  }

  const resetToken = generateToken(user._id, '1h');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetURL);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return next(errorHandler(500, 'Error sending password reset email'));
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(errorHandler(400, 'Missing required fields'));
  }

  if (!isStrongPassword(newPassword)) {
    return next(errorHandler(400, 'Password not strong enough'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(errorHandler(400, 'Invalid or expired token'));
  }

  const user = await User.findOne({
    _id: decoded.userId,
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(errorHandler(400, 'Invalid or expired token'));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password has been reset successfully' });
};

// Validate reset token
export const validateResetToken = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(errorHandler(400, 'Token is required'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(errorHandler(400, 'Invalid or expired token'));
  }

  const user = await User.findOne({
    _id: decoded.userId,
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(errorHandler(400, 'Invalid or expired token'));
  }

  res.status(200).json({ message: 'Token is valid' });
};

export const logout = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  console.log({ refreshToken });

  if (refreshToken) {
    // Find the user with this refresh token and remove it
    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
  }

  // Clear the cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({ message: 'Logged out successfully' });
};
