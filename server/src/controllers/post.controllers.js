import { PostService } from "../services/post.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const postService = new PostService();

export class PostController {

  // POST /api/v1/posts/:blogSlug
  // Body: { title, contentHtml?, excerpt?, coverImageUrl?, tags?, status? }
  // status defaults to "draft" — send "published" to publish immediately
  create = catchAsync(async (req, res) => {
    const data = await postService.createPost(
      req.params.blogSlug,
      req.body,
      req.user.id
    );

    const isDraft = data.status === "draft";

    res.status(201).json({
      success: true,
      message: isDraft ? "Post saved as draft" : "Post created and published",
      data,
    });
  });

  // GET /api/v1/posts/:blogSlug/:postSlug
  // Readers see published only; owners also see their own drafts
  getPost = catchAsync(async (req, res) => {
    const requesterId = req.user?.id || null;

    const data = await postService.getPost(
      req.params.blogSlug,
      req.params.postSlug,
      requesterId
    );

    res.status(200).json({
      success: true,
      data,
    });
  });

  // GET /api/v1/posts/:blogSlug
  // Query params: page, limit, tag
  listPosts = catchAsync(async (req, res) => {
    const data = await postService.listPosts(req.params.blogSlug, {
      page: req.query.page,
      limit: req.query.limit,
      tag: req.query.tag,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  // PATCH /api/v1/posts/:blogSlug/:postSlug
  update = catchAsync(async (req, res) => {
    const data = await postService.updatePost(
      req.params.blogSlug,
      req.params.postSlug,
      req.body,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data,
    });
  });

  // DELETE /api/v1/posts/:blogSlug/:postSlug
  delete = catchAsync(async (req, res) => {
    const data = await postService.deletePost(
      req.params.blogSlug,
      req.params.postSlug,
      req.user.id
    );

    res.status(200).json({
      success: true,
      ...data,
    });
  });

  // PATCH /api/v1/posts/:blogSlug/:postSlug/publish
  publish = catchAsync(async (req, res) => {
    const data = await postService.setPublishStatus(
      req.params.blogSlug,
      req.params.postSlug,
      true,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Post published successfully",
      data,
    });
  });

  // PATCH /api/v1/posts/:blogSlug/:postSlug/unpublish
  unpublish = catchAsync(async (req, res) => {
    const data = await postService.setPublishStatus(
      req.params.blogSlug,
      req.params.postSlug,
      false,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Post moved back to draft",
      data,
    });
  });
}
