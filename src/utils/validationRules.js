import { body } from 'express-validator';

export const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('password').notEmpty().withMessage('Password field cannot be empty.'),
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
    .withMessage('OTP must be exactly 6 digits long.'),
];

export const validatePhoneVerification = [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number.'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits long.'),
];
