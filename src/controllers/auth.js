import User from '../models/user.js';
import { sendEmailOTP } from '../services/emailService.js';
import { generateOTP, isOTPValid } from '../services/otpService.js';
import { sendPhoneOTP } from '../services/phoneService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService.js';
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
