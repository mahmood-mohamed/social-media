import { Router } from "express";
import adminServices from "./admin.service";
import { isAdmin, isValid } from "../../middleware";
import { postIdSchema } from "../post/post.validation";
import { commentIdSchema } from './../comment/comment.validation';


const router = Router();

// private route to access admin routes
router.use(isAdmin())

// 🔥 Get all posts
router.get('/posts/deleted', adminServices.getAllDeletedPosts);


router.patch('/post/:postId/restore', adminServices.restorePost); // 🔥 Restore post (Admin only) 
router.delete('/post/:postId/hard', isValid(postIdSchema), adminServices.hardDeletePost); // 🔥 Hard delete post (Admin only)


router.delete('/comment/:commentId/hard', isValid(commentIdSchema), adminServices.hardDeleteComment);
router.patch("/comment/:commentId/restore", adminServices.restoreComment);


export default router;
