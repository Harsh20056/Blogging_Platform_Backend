import { Like, User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class LikeRepository extends BaseRepository {
  constructor() {
    super(Like);
  }

  // Check if a user has liked a specific post
  async findLike(postId, userId) {
    return await this.model.findOne({
      where: { postId, userId },
    });
  }

  // Get total likes count for a post
  async countLikes(postId) {
    return await this.model.count({
      where: { postId },
    });
  }

  // Get users who liked a post (paginated)
  async findLikersByPost(postId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    return await this.model.findAndCountAll({
      where: { postId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "fullName", "avatarUrl"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }
}
