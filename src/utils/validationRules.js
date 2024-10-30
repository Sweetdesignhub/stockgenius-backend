import { body, param, cookie, oneOf } from 'express-validator';

export const validateLogin = [
  body('identifier').notEmpty().withMessage('Identifier is required'),
  body('useOTP').isBoolean().optional(),
  body('password')
    .if(body('useOTP').not().equals('true'))
    .notEmpty()
    .withMessage('Password is required when not using OTP'),
];

export const verifyOTPValidation = [
  body('identifier').notEmpty().withMessage('Identifier is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
];

export const validateSignup = [
  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('name').notEmpty().withMessage('Name field cannot be empty.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.'),
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number.'),
  body('country').notEmpty().withMessage('Country field cannot be empty.'),
  body('state').notEmpty().withMessage('State field cannot be empty.'),
];

export const validateEmailVerification = [
  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be exactly 6 digits long.'),
];

export const validatePhoneVerification = [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number.'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be exactly 6 digits long.'),
];

export const validateResendOTP = [
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
  oneOf([
    body('email').exists(),
    body('phoneNumber').exists()
  ], 'Either email or phone number must be provided')
];

export const validateForgotPassword = [
  body('email').isEmail().withMessage('Please enter a valid email address.'),
];

export const validateResetPassword = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.'),
];

export const validateResetToken = [
  param('token').notEmpty().withMessage('Token is required'),
];

// export const validateRefreshToken = [
//   cookie('refreshToken').notEmpty().withMessage('Refresh token is required'),
// ];

export const validateRefreshToken = [
  cookie('accessToken').notEmpty().withMessage('Access token missing. Unable to refresh.'),
];

