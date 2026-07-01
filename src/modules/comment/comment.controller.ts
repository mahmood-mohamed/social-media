import { Router } from "express";
import commentServices from "./comment.service";
import { isAuthenticated } from "../../middleware/auth.middleware";
import { isValid } from "../../middleware/validation.middleware";
import * as CV from "./comment.validation";
import { validateMentions, uploadFileToCloud, validateImageUpload } from "../../middleware";

const router = Router({ mergeParams: true });

// private route
router.use(isAuthenticated());

// route to replay comment >> /comment/:commentId
router.post(
    "/:commentId",
    // isValid(CV.createCommentSchema),
    uploadFileToCloud().single("attachment"),
    validateImageUpload(false),
    validateMentions("comment"),
    commentServices.createComment
);  // 📝 Create reply only
// route to create comment & reply >> /post/:postId/comment/{:commentId}
router.post(
    "{/:commentId}",
    // isValid(CV.createCommentSchema),
    uploadFileToCloud().single("attachment"),
    validateImageUpload(false),
    validateMentions("comment"),
    commentServices.createComment
);  // 📝 Create Comment & reply

router.get("/:commentId/replies", isValid(CV.commentIdSchema), commentServices.getCommentReplies);  // 📝 Get Replies pagination
router.get("/:commentId/reactions", isValid(CV.reactionSchema), commentServices.getCommentReactions);  // 👍 Get User Reaction
router.patch("/:commentId/reaction", isValid(CV.reactionSchema), commentServices.reaction);  // 👍 Handle Reaction

// 📝 Update Comment | Reply
router.patch("/:commentId",
    isValid(CV.commentIdSchema),
    uploadFileToCloud().single("attachment"),
    validateImageUpload(false),
    validateMentions("comment"),
    commentServices.updateComment
);
router.delete("/:commentId", isValid(CV.commentIdSchema), commentServices.softDeleteComment);  // 🫥 Soft Delete Comments | Replies


export default router;
