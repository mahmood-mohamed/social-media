import { Router } from "express";
import userServices from "./user.service";
import * as UV from "./user.validation";
import { isValid } from "../../middleware/validation.middleware";

const router = Router();
router.get("/:id", isValid(UV.idSchema), userServices.getProfileById);

export default router;
