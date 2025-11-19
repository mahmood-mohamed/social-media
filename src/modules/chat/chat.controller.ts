import { Router } from "express";
import chatServices from "./chat.service";
import { isAuthenticated } from "../../middleware";
const router = Router();

router.get('/:receiverId', isAuthenticated(), chatServices.getChat);


export default router;
