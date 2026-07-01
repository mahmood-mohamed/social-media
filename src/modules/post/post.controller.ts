import { Router } from "express";
import { commentRouter } from "..";
import postServices from "./post.service";
import * as PV from './post.validation';
import { isAuthenticated, isValid, validateMentions, uploadFileToCloud, validateUpload } from "../../middleware";

const router = Router();

// Attach comment routes to post routes
router.use('/:postId/comments', commentRouter);

// private route
router.use(isAuthenticated());

router.get("/feed", postServices.getFeed); // ✅ Get all posts of friends, public posts, my posts + avoid blocked users + pagination
router.get("/user/:userId", postServices.getUserPosts);  // ✅ Get all posts of a user (public + friends + only me + avoid blocked users)
router.get('/:postId', isValid(PV.postIdSchema), postServices.getSpecificPost);  // ✅ Get Specific Post with pagination + preview 3 comments + counts

router.get("/:postId/reactions", isValid(PV.postIdSchema), postServices.getPostReactions);  // 👍 reactions details (paged)
router.get("/:postId/comments", isValid(PV.postIdSchema), postServices.getPostComments);  // 📝 comments pagination

//* 📝 Create
router.post("/",
    uploadFileToCloud().array("attachments", 5),
    validateUpload,
    validateMentions("post"),
    postServices.createPost
);
//* 📝 Update
router.patch('/:postId',
    isValid(PV.postIdSchema),
    uploadFileToCloud().array("attachments", 5),
    validateUpload,
    validateMentions("post"),
    postServices.updatePost
);
router.patch('/:postId/reaction', isValid(PV.reactionSchema), postServices.reaction);  // 👍 Reaction
router.delete('/:postId', isValid(PV.postIdSchema), postServices.softDeletePost);  // 🗑️ Soft Delete post by owner | admin


export default router;
