import { Router } from "express";
import userService from "./user.service";
import * as UV from "./user.validation";
import { isValid } from "../../middleware/validation.middleware";
import { isAuthenticated } from "../../middleware/auth.middleware";

const router = Router();

// private route
router.use(isAuthenticated());

router.patch('/update-password', isValid(UV.updateLoggedInUserPasswordSchema), userService.updateLoggedInUserPassword); // 🔑 Update password

router.get("/search", isValid(UV.searchUsersSchema), userService.searchUsers); //🔎 Search

router.get("/:id", isValid(UV.idSchema), userService.getProfileById); //👤 Profile

router.post("/update-email", isValid(UV.updateEmailSchema), userService.updateEmail); //📧 Update email
router.post("/update-user-email", isValid(UV.updateUserEmailSchema), userService.updateUserEmail); //📧 Update userEmail

router.post("/two-factor-auth", userService.is2faEnabled); //🔑 Two factor auth
router.patch("/enable-two-factor-auth", isValid(UV.enable2faSchema), userService.enable2fa); //🔑 Enable two factor auth
router.patch("/disable-two-factor-auth", userService.disable2fa); //🔑 Disable two factor auth

export default router;
