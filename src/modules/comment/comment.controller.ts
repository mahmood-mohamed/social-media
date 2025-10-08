import { Router } from "express";
import commentServices from "./comment.service";
import { isAuthenticated } from "../../middleware/auth.middleware";
import { isValid } from "../../middleware/validation.middleware";
import * as CV from "./comment.validation";
const router = Router({ mergeParams: true });



// private route
router.use(isAuthenticated());

// route to replay comment >> /comment/:commentId
// route to create comment & reply >> /post/:postId/comment/{:commentId}
router.post("/:id", isValid(CV.createCommentSchema), commentServices.create);  // 📝 Create reply only
router.post("{/:id}", isValid(CV.createCommentSchema), commentServices.create);  // 📝 Create Comment & reply
router.delete("/:commentId", commentServices.delete);  // 🗑️ Delete


export default router;
