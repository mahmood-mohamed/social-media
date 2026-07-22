import { isValid } from "../../middleware/validation.middleware";
import authService from "./auth.service";
import {Router} from "express";
import * as AV from "./auth.validation";
import { isAuthenticated } from "../../middleware/auth.middleware";
const router = Router();

router.post('/register',isValid(AV.registerSchema), authService.register); //👋 Registration
router.post('/verify-account',isValid(AV.verifyAccountSchema), authService.verifyAccount); //✔️ Verify account
router.post('/resend-otp', isValid(AV.emailSchema), authService.resendOTP); //♻️ Resend OTP
router.post('/login', isValid(AV.loginSchema), authService.login); //✅ Login
router.post('/confirm-login', isValid(AV.verifyAccountSchema), authService.confirmLogin); //✅ Confirm login
router.post('/google-login', authService.googleLogin); //🌍 Google login
router.post('/forgot-password', isValid(AV.emailSchema), authService.forgotPassword); // 🔑 Forgot password
router.post('/reset-password', isValid(AV.resetPasswordSchema), authService.resetPassword); // 🔑 Reset password

router.post('/refresh-token', isValid(AV.refreshTokenSchema), authService.refreshToken); //🔃 Refresh token

router.post('/logout', isAuthenticated(), authService.logout); //⛔ Logout



export default router;

