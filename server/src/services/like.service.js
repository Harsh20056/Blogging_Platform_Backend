import { LikeRepository } from "../repositories/like.repository.js";
import { PostRepository } from "../repositories/post.repository.js";
import { BlogRepository } from "../repositories/blog.repository.js";
import { AppError } from "../utils/AppError.js";

const likeRepo = new LikeRepository();
const postRepo = new PostRepository();
const blogRepo = new BlogRepository();

export class LikeService {
  
  async resolveBlogAndPost(blogSlug, postSlug, includeUnpublished = false) {
    const blog = await blogRepo.findBySlug(blogSlug);
    if (!blog) throw new AppError("Blog not found", 404);

    const post = await postRepo.findByBlogAndSlug(blog.id, postSlug, includeUnpublished);
    return { blog, post };
  }

  async likePost(blogSlug, postSlug, userId) {
    // Only published posts can be liked
    const { post } = await this.resolveBlogAndPost(blogSlug, postSlug, false);

    const existingLike = await likeRepo.findLike(post.id, userId);
    if (!existingLike) {
      await likeRepo.create({
        postId: post.id,
        userId: userId,
      });
    }

    const likeCount = await likeRepo.countLikes(post.id);

    return {
      postId: post.id,
      likeCount,
      hasLiked: true,
    };
  }

  async unlikePost(blogSlug, postSlug, userId) {
    // Users can unlike posts that they previously liked (even if owner unpublished it, they can still view/delete their like from general perspective, but let's allow on published posts primarily)
    const { post } = await this.resolveBlogAndPost(blogSlug, postSlug, true);

    const existingLike = await likeRepo.findLike(post.id, userId);
    if (existingLike) {
      await likeRepo.delete(existingLike.id);
    }

    const likeCount = await likeRepo.countLikes(post.id);

    return {
      postId: post.id,
      likeCount,
      hasLiked: false,
    };
  }

  async getLikeInfo(blogSlug, postSlug, userId = null) {
    const { post } = await this.resolveBlogAndPost(blogSlug, postSlug, true);

    const likeCount = await likeRepo.countLikes(post.id);
    
    let hasLiked = false;
    if (userId) {
      const like = await likeRepo.findLike(post.id, userId);
      hasLiked = !!like;
    }

    return {
      postId: post.id,
      likeCount,
      hasLiked,
    };
  }

  // Get list of users who liked the post (optional but useful)
  async getPostLikers(blogSlug, postSlug, options = {}) {
    const { post } = await this.resolveBlogAndPost(blogSlug, postSlug, true);
    
    const page = Math.max(parseInt(options.page) || 1, 1);
    const limit = Math.min(parseInt(options.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await likeRepo.findLikersByPost(post.id, { limit, offset });

    return {
      postId: post.id,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      likers: rows.map((like) => ({
        id: like.user.id,
        username: like.user.username,
        fullName: like.user.fullName,
        avatarUrl: like.user.avatarUrl,
        likedAt: like.createdAt,
      })),
    };
  }
}
