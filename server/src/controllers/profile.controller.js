import { ProfileService } from "../services/profile.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const profileService = new ProfileService();

export class ProfileController {

  // GET /api/v1/profile/me
  getMyProfile = catchAsync(async (req, res) => {
    const data = await profileService.getMyProfile(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  });

  // PATCH /api/v1/profile/me
  updateMyProfile = catchAsync(async (req, res) => {
    const data = await profileService.updateMyProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data,
    });
  });

  // POST /api/v1/profile/me/avatar
  // Expects multipart/form-data with field name "avatar"
  uploadAvatar = catchAsync(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const data = await profileService.uploadAvatar(
      req.user.id,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data,
    });
  });

  // GET /api/v1/profile/:username
  getPublicCreatorProfile = catchAsync(async (req, res) => {
    const data = await profileService.getPublicCreatorProfile(req.params.username);

    res.status(200).json({
      success: true,
      data,
    });
  });
}
