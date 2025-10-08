import { Router } from "express";
import { commentRouter } from "..";
import postServices from "./post.service";
import { isAuthenticated } from "../../middleware/auth.middleware";
import { isValid } from "../../middleware/validation.middleware";
import * as PV from './post.validation';
import { validateMentions } from "../../middleware/validateMentions.middleware";

const router = Router();

// Attach comment routes to post routes
router.use('/:postId/comment', commentRouter);

// public route
router.get('/:postId', postServices.getSpecificPost);  // 📝 Get specific post

// private route
router.use(isAuthenticated());

router.post('/', validateMentions, isValid(PV.createPostSchema), postServices.create);  // 📝 Create
router.patch('/:postId', isValid(PV.reactionSchema), postServices.reaction);  // 👍 Reaction
router.delete('/:postId', isValid(PV.deletePostSchema), postServices.delete);  // 🗑️ Delete


export default router;
