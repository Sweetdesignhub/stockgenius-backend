import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  verifyEmail,
  verifyPhone,
  login,
  refreshToken,
} from '../controllers/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail(),
    body('name').notEmpty(),
    body('password').isLength({ min: 8 }),
    body('phoneNumber').isMobilePhone(),
    body('country').notEmpty(),
    body('state').notEmpty(),
    validateRequest,
  ],
  asyncHandler(signup)
);

router.post(
  '/verify-email',
  [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    validateRequest,
  ],
  asyncHandler(verifyEmail)
);

router.post(
  '/verify-phone',
  [
    body('phoneNumber').isMobilePhone(),
    body('otp').isLength({ min: 6, max: 6 }),
    validateRequest,
  ],
  asyncHandler(verifyPhone)
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail(), body('password').notEmpty(), validateRequest],
  asyncHandler(login)
);

router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty(), validateRequest],
  asyncHandler(refreshToken)
);

export default router;
