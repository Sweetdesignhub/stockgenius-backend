import otpGenerator from 'otp-generator';

export const generateOTP = () =>
  otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });

export const isOTPValid = (storedOTP, inputOTP, expiryTime) =>
  storedOTP === inputOTP && new Date() < expiryTime;
