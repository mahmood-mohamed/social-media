import { Router } from "express";
import { commentRouter } from "..";
import postServices from "./post.service";
import * as PV from './post.validation';
import { isAuthenticated, isValid, notifyMentions, uploadFileToCloud, validateUpload } from "../../middleware";

const router = Router();

// Attach comment routes to post routes
router.use('/:postId/comment', commentRouter);

// public route
router.get('/:postId', isValid(PV.postIdSchema), postServices.getSpecificPost);  // 📝 preview post + 3 comments + counts
router.get("/:postId/reactions", isValid(PV.postIdSchema), postServices.getPostReactions);  // 👍 reactions details (paged)

// private route
router.use(isAuthenticated());

router.get("/:postId/comments", isValid(PV.postIdSchema), postServices.getPostComments);  // 📝 comments pagination
//* 📝 Create
router.post('/', 
    uploadFileToCloud().array("attachments", 5), 
    validateUpload, 
    notifyMentions("post"),
    postServices.createPost
);  
//* 📝 Update
router.patch('/:postId', 
    isValid(PV.postIdSchema),
    uploadFileToCloud().array("attachments", 5), 
    validateUpload,    
    notifyMentions("post"), 
    postServices.updatePost
);  
router.patch('/:postId/reaction', isValid(PV.reactionSchema), postServices.reaction);  // 👍 Reaction
router.delete('/:postId', isValid(PV.postIdSchema), postServices.softDeletePost);  // 🗑️ Soft Delete post by owner | admin


export default router;
