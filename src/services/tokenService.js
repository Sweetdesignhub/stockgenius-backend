import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import User from '../models/user.js';

export const generateAccessToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
  return serialize('accessToken', token, {
    httpOnly: true,
    maxAge: 15 * 60, // 15 minutes
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const generateRefreshToken = async (user) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  user.refreshToken = token;
  await user.save();
  return serialize('refreshToken', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const verifyAccessToken = (req) => {
  try {
    const token = req.cookies.accessToken;
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = async (req) => {
  try {
    const token = req.cookies.refreshToken;
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== token) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};
