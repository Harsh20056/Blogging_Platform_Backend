import { Comment, User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

const authorInclude = {
  model: User,
  as: "author",
  attributes: ["id", "username", "fullName", "avatarUrl"],
};

export class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  async createComment(data) {
    const comment = await this.model.create(data);
    // Re-fetch with author included so the response is consistent
    return await this.model.findByPk(comment.id, {
      include: [authorInclude],
    });
  }

  async findByPost(postId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return await this.model.findAndCountAll({
      where: { postId },
      include: [authorInclude],
      order: [["createdAt", "ASC"]], // chronological — oldest first
      limit,
      offset,
    });
  }

  async findByIdAndAuthor(commentId, authorId) {
    const comment = await this.model.findOne({
      where: { id: commentId, authorId },
      include: [authorInclude],
    });
    if (!comment) throw new AppError("Comment not found or you are not the author", 404);
    return comment;
  }

  async updateComment(commentId, authorId, body) {
    const comment = await this.findByIdAndAuthor(commentId, authorId);
    return await comment.update({ body, isEdited: true });
  }

  async deleteComment(commentId, authorId) {
    const comment = await this.findByIdAndAuthor(commentId, authorId);
    return await comment.destroy(); // soft delete via paranoid
  }
}
