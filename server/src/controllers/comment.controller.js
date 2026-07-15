import { CommentService } from "../services/comment.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const commentService = new CommentService();

export class CommentController {

  // POST /api/v1/comments/:postId
  addComment = catchAsync(async (req, res) => {
    const data = await commentService.addComment(
      req.params.postId,
      req.user.id,
      req.body.body
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data,
    });
  });

  // GET /api/v1/comments/:postId
  // Query: page, limit
  getComments = catchAsync(async (req, res) => {
    const data = await commentService.getComments(req.params.postId, {
      page:  req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  // PATCH /api/v1/comments/:commentId
  updateComment = catchAsync(async (req, res) => {
    const data = await commentService.updateComment(
      req.params.commentId,
      req.user.id,
      req.body.body
    );

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data,
    });
  });

  // DELETE /api/v1/comments/:commentId
  deleteComment = catchAsync(async (req, res) => {
    const data = await commentService.deleteComment(
      req.params.commentId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      ...data,
    });
  });
}
