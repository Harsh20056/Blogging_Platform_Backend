import { Op } from "sequelize";
import { User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class AuthRepository extends BaseRepository{
    constructor(){
        super(User);
    }

    async createUser(data){
        return await this.model.create(data);
    }

    async findByEmail(email) {
    return await this.model.scope("withPassword").findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

   async findByUsername(username) {
    return await this.model.findOne({
      where: { username: username.trim() },
    });
  }

   async updateLastLogin(id) {
    const user = await this.model.findByPk(id);
    if (!user) throw new AppError("User not found", 404);
    return await user.update({ lastLoginAt: new Date() });
  }

  async findById(id) {
    const user = await this.model.findByPk(id);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  async savePasswordResetToken(id, hashedToken, expiresAt) {
    const user = await this.model.findByPk(id);
    if (!user) throw new AppError("User not found", 404);
    return await user.update({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
    });
  }

  async findByResetToken(hashedToken) {
    return await this.model.scope("withPassword").findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {
          [Op.gt]: new Date(), // token must not be expired
        },
      },
    });
  }

  async resetPassword(id, hashedPassword) {
    const user = await this.model.findByPk(id);
    if (!user) throw new AppError("User not found", 404);
    return await user.update({
      password: hashedPassword,
      passwordResetToken: null,       // invalidate token
      passwordResetExpiresAt: null,   // clear expiry
    });
  }
}