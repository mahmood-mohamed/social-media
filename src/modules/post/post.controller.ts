import { Router } from "express";
import postServices from "./post.service";
import { isAuthenticated } from "../../middleware/auth.middleware";
import { isValid } from "../../middleware/validation.middleware";
import * as PV from './post.validation';

const router = Router();

router.post('/', isAuthenticated(), isValid(PV.createPostSchema), postServices.create);  // 📝 Create

router.patch('/:postId', isAuthenticated(), isValid(PV.reactionSchema), postServices.reaction);  // 👍 Reaction

// public route
router.get('/:postId', postServices.getSpecificPost);  // 📝 Get specific post





export default router;
