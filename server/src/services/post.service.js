import { PostRepository } from "../repositories/post.repository.js";
import { BlogRepository } from "../repositories/blog.repository.js";
import { AppError } from "../utils/AppError.js";
import { sanitizePostContent } from "../utils/sanitizePostContent.js";

const postRepo = new PostRepository();
const blogRepo = new BlogRepository();

export class PostService {

  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
      .replace(/\s+/g, "-")            // spaces → hyphens
      .replace(/-+/g, "-")             // collapse multiple hyphens
      .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
  }

  // Ensures slug is unique within the blog — appends a counter suffix if needed
  async ensureUniqueSlug(blogId, baseSlug, excludePostId = null) {
    let slug = baseSlug;
    let counter = 1;

    while (await postRepo.slugExistsInBlog(blogId, slug, excludePostId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async resolveBlogAndVerifyOwner(blogSlug, requesterId) {
    const blog = await blogRepo.findBySlug(blogSlug);
    if (!blog) throw new AppError("Blog not found", 404);
    if (blog.ownerId !== requesterId) {
      throw new AppError("Forbidden. You do not own this blog.", 403);
    }
    return blog;
  }

  // Also covers Story #21 (Save as Draft) — pass status: "draft"
  async createPost(blogSlug, payload, authorId) {
    const blog = await this.resolveBlogAndVerifyOwner(blogSlug, authorId);

    // Story #22 — auto-generate slug from title, make it blog-scoped unique
    const rawSlug = this.generateSlug(payload.title);
    const slug = await this.ensureUniqueSlug(blog.id, rawSlug);

    // Sanitize HTML content to prevent XSS
    const contentHtml = sanitizePostContent(payload.contentHtml || "");

    const post = await postRepo.createPost({
      blogId: blog.id,
      authorId,
      title: payload.title.trim(),
      slug,
      contentHtml,
      excerpt: payload.excerpt?.trim() || null,
      coverImageUrl: payload.coverImageUrl?.trim() || null,
      tags: Array.isArray(payload.tags)
        ? payload.tags.map((t) => t.toLowerCase().trim())
        : [],
      // Story #21: default to "draft", "published" if explicitly set
      status: payload.status === "published" ? "published" : "draft",
      publishedAt: payload.status === "published" ? new Date() : null,
    });

    return this.formatPost(post);
  }

  async getPost(blogSlug, postSlug, requesterId = null) {
    const blog = await blogRepo.findBySlug(blogSlug);
    if (!blog) throw new AppError("Blog not found", 404);

    // Owners can preview their own drafts
    const isOwner = requesterId && blog.ownerId === requesterId;
    const post = await postRepo.findByBlogAndSlug(blog.id, postSlug, isOwner);

    // Increment view count asynchronously (fire-and-forget)
    postRepo.updatePost(post.id, { viewCount: (post.viewCount || 0) + 1 }).catch(() => {});

    // Fetch likes count and user like status
    const { Like } = await import("../models/index.js");
    const likesCount = await Like.count({ where: { postId: post.id } });
    let hasLiked = false;
    if (requesterId) {
      const existingLike = await Like.findOne({ where: { postId: post.id, userId: requesterId } });
      hasLiked = !!existingLike;
    }

    return this.formatPost(post, { likesCount, hasLiked });
  }

  async listPosts(blogSlug, options = {}) {
    const blog = await blogRepo.findBySlug(blogSlug);
    if (!blog) throw new AppError("Blog not found", 404);

    const page = Math.max(parseInt(options.page) || 1, 1);
    const limit = Math.min(parseInt(options.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { rows, count } = await postRepo.findPublishedByBlog(blog.id, {
      limit,
      offset,
      tag: options.tag,
    });

    return {
      blog: { id: blog.id, name: blog.name, slug: blog.slug },
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      posts: rows.map((p) => this.formatPostSummary(p)),
    };
  }

  async updatePost(blogSlug, postSlug, payload, requesterId) {
    const blog = await this.resolveBlogAndVerifyOwner(blogSlug, requesterId);
    const post = await postRepo.findByBlogAndSlug(blog.id, postSlug, true);

    const updateData = {};

    if (payload.title !== undefined) {
      updateData.title = payload.title.trim();
      // Story #22 — regenerate slug if title changes (keep it blog-scoped unique)
      const newSlug = this.generateSlug(payload.title);
      updateData.slug = await this.ensureUniqueSlug(blog.id, newSlug, post.id);
    }

    if (payload.contentHtml !== undefined) {
      updateData.contentHtml = sanitizePostContent(payload.contentHtml);
    }

    if (payload.excerpt !== undefined) {
      updateData.excerpt = payload.excerpt?.trim() || null;
    }

    if (payload.coverImageUrl !== undefined) {
      updateData.coverImageUrl = payload.coverImageUrl?.trim() || null;
    }

    if (payload.tags !== undefined) {
      updateData.tags = Array.isArray(payload.tags)
        ? payload.tags.map((t) => t.toLowerCase().trim())
        : [];
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No valid fields provided to update", 400);
    }

    const updated = await postRepo.updatePost(post.id, updateData);
    return this.formatPost(updated);
  }

  async deletePost(blogSlug, postSlug, requesterId) {
    const blog = await this.resolveBlogAndVerifyOwner(blogSlug, requesterId);
    const post = await postRepo.findByBlogAndSlug(blog.id, postSlug, true);

    await postRepo.deletePost(post.id);
    return { message: "Post deleted successfully" };
  }

  async setPublishStatus(blogSlug, postSlug, publish, requesterId) {
    const blog = await this.resolveBlogAndVerifyOwner(blogSlug, requesterId);
    const post = await postRepo.findByBlogAndSlug(blog.id, postSlug, true);

    if (publish && post.status === "published") {
      throw new AppError("Post is already published", 400);
    }
    if (!publish && post.status === "draft") {
      throw new AppError("Post is already a draft", 400);
    }

    const updated = await postRepo.setPublishStatus(post.id, publish);
    return this.formatPost(updated);
  }

  // Full detail (single post view — includes contentHtml)
  formatPost(post, extra = {}) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      contentHtml: post.contentHtml,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      tags: post.tags || [],
      status: post.status,
      viewCount: post.viewCount,
      likesCount: extra.likesCount !== undefined ? extra.likesCount : 0,
      hasLiked: extra.hasLiked !== undefined ? extra.hasLiked : false,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            avatarUrl: post.author.avatarUrl,
          }
        : null,
      blog: post.blog
        ? { id: post.blog.id, name: post.blog.name, slug: post.blog.slug }
        : null,
    };
  }

  // Summary (listing — no contentHtml to keep payload small)
  formatPostSummary(post) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      tags: post.tags || [],
      status: post.status,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      author: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            avatarUrl: post.author.avatarUrl,
          }
        : null,
    };
  }
}
