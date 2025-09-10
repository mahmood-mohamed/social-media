import authService from "./auth.service";
import {Router} from "express";

const router = Router();

router.post('/register', authService.register); // Registration route
router.post('/login', authService.login); // Login route

export default router;

