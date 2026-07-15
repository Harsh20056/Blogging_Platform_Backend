import express from "express";
import { CommentController } from "../controllers/comment.controller.js";
import { identifyUser } from "../middlewares/security/index.js";
import {
  addCommentValidator,
  updateCommentValidator,
} from "../middlewares/validators/comment.validator.js";

const router = express.Router();
const ctrl = new CommentController();

// Routes scoped to a specific post
// Base: /api/v1/comments

// View comments on a post (public — no auth required)
// GET /api/v1/comments/:postId
router.get("/:postId", ctrl.getComments);

//  Add a comment (must be logged in)
// POST /api/v1/comments/:postId
router.post("/:postId", identifyUser, addCommentValidator, ctrl.addComment);

// Routes scoped to a specific comment

// Update own comment
// PATCH /api/v1/comments/:commentId
router.patch("/:commentId", identifyUser, updateCommentValidator, ctrl.updateComment);

// Delete own comment
// DELETE /api/v1/comments/:commentId
router.delete("/:commentId", identifyUser, ctrl.deleteComment);

export default router;
