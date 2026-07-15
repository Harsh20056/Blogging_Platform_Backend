import { Media } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class MediaRepository extends BaseRepository {
  constructor() {
    super(Media);
  }

  async createMedia(data) {
    return await this.model.create(data);
  }

  async findByUser(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return await this.model.findAndCountAll({
      where: { userId },
      order: [["createdAt", "DESC"]], // Show newest uploads first
      limit,
      offset,
    });
  }

  async findByIdAndUser(mediaId, userId) {
    const media = await this.model.findOne({
      where: { id: mediaId, userId },
    });
    if (!media) throw new AppError("Media file not found or unauthorized", 404);
    return media;
  }
}
