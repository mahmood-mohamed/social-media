import { Router } from "express";
import userServices from "./user.service";
import * as UV from "./user.validation";
import { isValid } from "../../middleware/validation.middleware";
import { isAuthenticated } from "../../middleware/auth.middleware";

const router = Router();
router.get(
  "/:id",
  isAuthenticated(),
  isValid(UV.idSchema),
  userServices.getProfileById
);

export default router;
