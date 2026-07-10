import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.post('/signup', asyncHandler(authController.signup));
router.post('/verify-otp', asyncHandler(authController.verifyOtp));
router.post('/login', asyncHandler(authController.login));
router.post('/resend-otp', asyncHandler(authController.resendOtp));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));
router.get('/google', asyncHandler(authController.googleLogin));
router.get('/google/callback', asyncHandler(authController.googleCallback));
router.get('/session', authMiddleware, asyncHandler(authController.checkSession));

export default router;
