import {
  isValidEmail,
  isValidPhoneNumber,
  isStrongPassword,
} from '../utils/validators.js';
import { generateOTP, isOTPValid } from '../services/otpService.js';
import { sendEmailOTP } from '../services/emailService.js';
import { sendPhoneOTP } from '../services/phoneService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService.js';
import User from '../models/user.js';

export const signup = async (req, res) => {
  const { email, name, password, phoneNumber, country, state } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password not strong enough' });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });
  if (existingUser) {
    return res
      .status(400)
      .json({ error: 'Email or phone number already in use' });
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

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!isOTPValid(user.emailOTP, otp, user.otpExpiry)) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  user.isEmailVerified = true;
  user.emailOTP = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully' });
};

export const verifyPhone = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!isOTPValid(user.phoneOTP, otp, user.otpExpiry)) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  user.isPhoneVerified = true;
  user.phoneOTP = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ message: 'Phone number verified successfully' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.isEmailVerified || !user.isPhoneVerified) {
    return res.status(403).json({ error: 'Account not fully verified' });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.json({ accessToken, refreshToken });
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken(payload.userId);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};
