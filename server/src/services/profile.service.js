import { v2 as cloudinary } from "cloudinary";
import { ProfileRepository } from "../repositories/profile.repository.js";
import { AppError } from "../utils/AppError.js";

const profileRepo = new ProfileRepository();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class ProfileService {
  async getMyProfile(userId) {
    const user = await profileRepo.findMyProfile(userId);
    return this.formatProfile(user);
  }

  // Text fields: fullName, bio, websiteUrl, preferences
  async updateMyProfile(userId, payload) {
    const allowedFields = ["fullName", "bio", "websiteUrl", "preferences"];
    const updateData = {};

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        if (field === "fullName") {
          updateData.fullName = payload.fullName.trim() || null;
        } else if (field === "websiteUrl") {
          updateData.websiteUrl = payload.websiteUrl?.trim() || null;
        } else if (field === "bio") {
          updateData.bio = payload.bio?.trim() || null;
        } else {
          updateData[field] = payload[field];
        }
      }
    }

    const updated = await profileRepo.updateProfile(userId, updateData);
    return this.formatProfile(updated);
  }

  // Uploads to Cloudinary and saves the returned secure URL in the DB
  async uploadAvatar(userId, fileBuffer, mimetype) {
    if (!fileBuffer) throw new AppError("No image file provided", 400);

    // Upload buffer directly to Cloudinary (no temp file needed)
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blogging_platform/avatars",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(new AppError("Avatar upload failed", 500));
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    const updated = await profileRepo.updateProfile(userId, {
      avatarUrl: uploadResult.secure_url,
    });

    return {
      avatarUrl: updated.avatarUrl,
    };
  }

  async getPublicCreatorProfile(username) {
    const user = await profileRepo.findPublicProfile(username);
    return this.formatPublicProfile(user);
  }

  // Full profile (own — authenticated)
  formatProfile(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      websiteUrl: user.websiteUrl,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Public profile (reader viewing a creator)
  formatPublicProfile(user) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      websiteUrl: user.websiteUrl,
      memberSince: user.createdAt,
    };
  }
}
