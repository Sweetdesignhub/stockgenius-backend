import { Router } from 'express';
import {
  signup,
  verifyEmail,
  verifyPhone,
  login,
  refreshToken,
} from '../controllers/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  validateLogin,
  validateSignup,
  validateEmailVerification,
  validatePhoneVerification,
} from '../utils/validationRules.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router
  .post('/signup', validateSignup, validateRequest, asyncHandler(signup))
  .post(
    '/verify-email',
    validateEmailVerification,
    validateRequest,
    asyncHandler(verifyEmail)
  )
  .post(
    '/verify-phone',
    validatePhoneVerification,
    validateRequest,
    asyncHandler(verifyPhone)
  )
  .post('/login', validateLogin, validateRequest, asyncHandler(login));

export default router;
