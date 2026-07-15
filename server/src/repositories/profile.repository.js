import { User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class ProfileRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  // Returns the full authenticated user profile (excludes password by defaultScope)
  async findMyProfile(userId) {
    const user = await this.model.findByPk(userId);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  // Updates only the safe profile fields — never touches password/status/email
  async updateProfile(userId, data) {
    const user = await this.model.findByPk(userId);
    if (!user) throw new AppError("User not found", 404);
    return await user.update(data);
  }

  // Returns only the public-safe scope defined on the User model
  async findPublicProfile(username) {
    const user = await this.model
      .scope("publicProfile")
      .findOne({ where: { username, status: "active" } });

    if (!user) throw new AppError("Creator not found", 404);
    return user;
  }
}
