import { v2 as cloudinary } from "cloudinary";
import { MediaRepository } from "../repositories/media.repository.js";
import { AppError } from "../utils/AppError.js";

const mediaRepo = new MediaRepository();

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class MediaService {
  
  async uploadImage(userId, file) {
    if (!file) throw new AppError("No file uploaded", 400);

    // Strict validation (double-checking mime type starts with image/)
    if (!file.mimetype.startsWith("image/")) {
      throw new AppError("Only image files are allowed", 400);
    }

    // Upload the file buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blogging_platform/media",
          resource_type: "image", // Force resource type as image
          quality: "auto",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) {
            reject(new AppError("Failed to upload image to cloud storage", 500));
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(file.buffer);
    });

    // Save metadata in database
    const media = await mediaRepo.createMedia({
      userId,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return this.formatMedia(media);
  }

  async listMedia(userId, options = {}) {
    const page = Math.max(parseInt(options.page) || 1, 1);
    const limit = Math.min(parseInt(options.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await mediaRepo.findByUser(userId, { limit, offset });

    return {
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      media: rows.map((m) => this.formatMedia(m)),
    };
  }

  async deleteMedia(mediaId, userId) {
    // 1. Find the media record (enforces ownership)
    const media = await mediaRepo.findByIdAndUser(mediaId, userId);

    // 2. Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch (error) {
      // Log error but proceed to delete from DB to keep storage clean in case cloud deleted it already
      console.error("Cloudinary deletion failed:", error);
    }

    // 3. Delete from database
    await media.destroy();

    return { message: "Media deleted successfully" };
  }

  formatMedia(media) {
    return {
      id: media.id,
      url: media.url,
      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
    };
  }
}
