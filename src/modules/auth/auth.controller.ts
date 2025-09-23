import { isValid } from "../../middleware/validation.middleware";
import authService from "./auth.service";
import {Router} from "express";
import * as AV from "./auth.validation";
const router = Router();

router.post('/register',isValid(AV.registerSchema), authService.register); // Registration route
router.post('/verify-account',isValid(AV.verifyAccountSchema), authService.verifyAccount); // Verify account route
router.post('/resend-otp', isValid(AV.emailSchema), authService.resendOTP); // Resend OTP route
router.post('/login', isValid(AV.loginSchema), authService.login); // Login route
router.post('/google-login', authService.googleLogin); // Google login route
router.post('/forget-password', isValid(AV.emailSchema), authService.forgetPassword); // Forgot password route
router.patch('/reset-password', isValid(AV.resetPasswordSchema), authService.resetPassword); // Reset password route

export default router;

