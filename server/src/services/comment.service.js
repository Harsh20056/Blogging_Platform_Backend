import { Post } from "../models/index.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { AppError } from "../utils/AppError.js";

const commentRepo = new CommentRepository();

export class CommentService {

  async resolvePublishedPost(postId) {
    const post = await Post.findByPk(postId);
    if (!post) throw new AppError("Post not found", 404);
    if (post.status !== "published") {
      throw new AppError("Cannot comment on an unpublished post", 403);
    }
    return post;
  }

  async resolvePost(postId) {
    const post = await Post.findByPk(postId);
    if (!post) throw new AppError("Post not found", 404);
    return post;
  }

  async addComment(postId, authorId, body) {
    await this.resolvePublishedPost(postId);

    const comment = await commentRepo.createComment({
      postId,
      authorId,
      body: body.trim(),
    });

    return this.formatComment(comment);
  }

  async getComments(postId, options = {}) {
    await this.resolvePost(postId);

    const page   = Math.max(parseInt(options.page)  || 1, 1);
    const limit  = Math.min(parseInt(options.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await commentRepo.findByPost(postId, { limit, offset });

    return {
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      comments: rows.map((c) => this.formatComment(c)),
    };
  }

  async updateComment(commentId, authorId, body) {
    const comment = await commentRepo.updateComment(commentId, authorId, body.trim());
    return this.formatComment(comment);
  }

  async deleteComment(commentId, authorId) {
    await commentRepo.deleteComment(commentId, authorId);
    return { message: "Comment deleted successfully" };
  }

  formatComment(comment) {
    return {
      id: comment.id,
      body: comment.body,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author
        ? {
            id: comment.author.id,
            username: comment.author.username,
            fullName: comment.author.fullName,
            avatarUrl: comment.author.avatarUrl,
          }
        : null,
    };
  }
}
