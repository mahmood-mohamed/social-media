import { Router } from "express";
import userService from "./user.service";
import * as UV from "./user.validation";
import { isValid } from "../../middleware/validation.middleware";
import { isAuthenticated, uploadFileToCloud, validateImageUpload } from "../../middleware";

const router = Router();

// private route
router.use(isAuthenticated());

router.get("/me", userService.getMyProfile); //👤 My Profile
router.get("/search", isValid(UV.searchUsersSchema), userService.searchUsers); //🔎 Search Users by first name, last name, or full name

router.get("/:id", isValid(UV.idSchema), userService.getProfileById); //👤 User Profile Info by ID

// by default, accepts images down to 3MB
router.patch(
     "/update-profile-picture",
     uploadFileToCloud().single("profilePicture"),  
     validateImageUpload(true),
     userService.updateProfilePicture
    ); //🖼️ Update Profile Picture

// 🔑 Update password
router.patch('/update-password', isValid(UV.updateLoggedInUserPasswordSchema), userService.updateLoggedInUserPassword);

// 📧 Step 1: Send OTPs to old and new emails
router.post("/update-email", isValid(UV.updateEmailSchema), userService.updateEmail); 
// 📧 Step 2: Verify OTPs and update email
router.patch("/confirm-update-email", isValid(UV.updateUserEmailSchema), userService.confirmUpdateEmail); 

router.post("user/2fa", userService.is2faEnabled); //🔑 Send OTP to email to enable 2FA
router.patch("user/2fa/enable", isValid(UV.enable2faSchema), userService.enable2fa); //🔑 Verify OTP & enable 2FA
router.patch("user/2fa/disable", userService.disable2fa); //🔑 Disable 2FA

export default router;
