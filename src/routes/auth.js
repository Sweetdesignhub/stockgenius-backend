import { Router } from 'express';
import {
  signup,
  verifyEmail,
  verifyPhone,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  validateResetToken,
  logout,
  googleUpdateUser,
  verifyLoginOTP,
  googleAuth,
  resendEmailOTP,
  resendPhoneOTP,
} from '../controllers/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  validateLogin,
  validateSignup,
  validateEmailVerification,
  validatePhoneVerification,
  verifyOTPValidation,
  validateForgotPassword,
  validateResetPassword,
  validateResetToken as resetTokenValidation,
  validateRefreshToken,
  validateResendOTP,
} from '../utils/validationRules.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyUser } from '../middlewares/verifyUser.js';

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
  .post('/login', validateLogin, validateRequest, asyncHandler(login))
  .post('/google-auth', asyncHandler(googleAuth))
  .post(
    '/verify-login-otp',
    verifyOTPValidation,
    validateRequest,
    asyncHandler(verifyLoginOTP)
  )
  .post(
    '/forgot-password',
    validateForgotPassword,
    validateRequest,
    asyncHandler(forgotPassword)
  )
  .patch(
    '/update-google-auth/:id',
    asyncHandler(googleUpdateUser)
  )
  .post(
    '/reset-password',
    validateResetPassword,
    validateRequest,
    asyncHandler(resetPassword)
  )
  .get(
    '/validate-reset-token/:token',
    resetTokenValidation,
    validateRequest,
    asyncHandler(validateResetToken)
  )
  .post(
    '/refresh-token',
    validateRefreshToken,
    validateRequest,
    asyncHandler(refreshToken)
  )
  .post('/sign-out', asyncHandler(logout))
  .post(
    '/resend-email-otp',
    validateResendOTP,
    validateRequest,
    asyncHandler(resendEmailOTP)
  )
  .post(
    '/resend-phone-otp',
    validateResendOTP,
    validateRequest,
    asyncHandler(resendPhoneOTP)
  );

export default router;
