import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import User from '../models/user.js';

export const generateAccessToken = (user) => {
  const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin, role:user.role }, process.env.JWT_ACCESS_SECRET, {
    // expiresIn: '1m',
    expiresIn: '24h',
  });
  return serialize('accessToken', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60, //24 hrs
    // maxAge: 1 * 60, // 15 minutes
    sameSite: 'none',
    path: '/',
    // secure: process.env.NODE_ENV === 'production',
    secure: true,
  });
};

export const generateRefreshToken = async (user) => {
  const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin , role:user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  user.refreshToken = token;
  await user.save();
  return serialize('refreshToken', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: 'none',
    path: '/',
    // secure: process.env.NODE_ENV === 'production',
    secure: true,
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

export const generateToken = (userId, expiresIn) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};
