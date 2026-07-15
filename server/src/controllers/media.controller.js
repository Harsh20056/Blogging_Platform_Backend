import { MediaService } from "../services/media.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const mediaService = new MediaService();

export class MediaController {
  
  // POST /api/v1/media
  upload = catchAsync(async (req, res) => {
    const data = await mediaService.uploadImage(req.user.id, req.file);

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data,
    });
  });

  // GET /api/v1/media
  list = catchAsync(async (req, res) => {
    const data = await mediaService.listMedia(req.user.id, {
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  // DELETE /api/v1/media/:id
  delete = catchAsync(async (req, res) => {
    const data = await mediaService.deleteMedia(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      ...data,
    });
  });
}
