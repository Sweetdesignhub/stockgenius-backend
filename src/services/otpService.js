import crypto from 'crypto';

export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  return otp;
};

export const isOTPValid = (storedOTP, inputOTP, expiryTime) => {
  return storedOTP === inputOTP && new Date() < new Date(expiryTime);
};
