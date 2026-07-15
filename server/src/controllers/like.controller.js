import { LikeService } from "../services/like.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const likeService = new LikeService();

export class LikeController {
  
  // POST /api/v1/posts/:blogSlug/:postSlug/like
  like = catchAsync(async (req, res) => {
    const data = await likeService.likePost(
      req.params.blogSlug,
      req.params.postSlug,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Post liked successfully",
      data,
    });
  });

  // DELETE /api/v1/posts/:blogSlug/:postSlug/like
  unlike = catchAsync(async (req, res) => {
    const data = await likeService.unlikePost(
      req.params.blogSlug,
      req.params.postSlug,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      data,
    });
  });

  // GET /api/v1/posts/:blogSlug/:postSlug/likes/count
  getLikeInfo = catchAsync(async (req, res) => {
    const requesterId = req.user?.id || null;

    const data = await likeService.getLikeInfo(
      req.params.blogSlug,
      req.params.postSlug,
      requesterId
    );

    res.status(200).json({
      success: true,
      data,
    });
  });

  // GET /api/v1/posts/:blogSlug/:postSlug/likes/users
  getLikers = catchAsync(async (req, res) => {
    const data = await likeService.getPostLikers(
      req.params.blogSlug,
      req.params.postSlug,
      {
        page: req.query.page,
        limit: req.query.limit,
      }
    );

    res.status(200).json({
      success: true,
      data,
    });
  });
}
