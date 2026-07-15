import { Op } from "sequelize";
import { Post, Blog, User, sequelize } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

const postDetailIncludes = [
  {
    model: User,
    as: "author",
    attributes: ["id", "username", "fullName", "avatarUrl"],
  },
  {
    model: Blog,
    as: "blog",
    attributes: ["id", "name", "slug"],
  },
];

const postListIncludes = [
  {
    model: User,
    as: "author",
    attributes: ["id", "username", "fullName", "avatarUrl"],
  },
];

export class PostRepository extends BaseRepository {
  constructor() {
    super(Post);
  }

  async createPost(data) {
    return await this.model.create(data);
  }

  async findByBlogAndSlug(blogId, slug, includeUnpublished = false) {
    const where = { blogId, slug };
    if (!includeUnpublished) {
      where.status = "published";
    }

    const post = await this.model.findOne({
      where,
      include: postDetailIncludes,
    });

    if (!post) throw new AppError("Post not found", 404);
    return post;
  }

  async findPublishedByBlog(blogId, options = {}) {
    const { limit = 10, offset = 0, tag } = options;

    const where = { blogId, status: "published" };

    // Filter by tag if provided
    if (tag) {
      where.tags = { [Op.contains]: [tag.toLowerCase()] };
    }

    return await this.model.findAndCountAll({
      where,
      include: postListIncludes,
      // Exclude heavy contentHtml in listings — fetch it only on single-post view
      attributes: { exclude: ["contentHtml"] },
      order: [["publishedAt", "DESC"]],
      limit,
      offset,
    });
  }

  async updatePost(postId, data) {
    const post = await this.model.findByPk(postId);
    if (!post) throw new AppError("Post not found", 404);
    return await post.update(data);
  }

  async deletePost(postId) {
    const post = await this.model.findByPk(postId);
    if (!post) throw new AppError("Post not found", 404);
    return await post.destroy();
  }

  async setPublishStatus(postId, publish) {
    const post = await this.model.findByPk(postId);
    if (!post) throw new AppError("Post not found", 404);

    return await post.update({
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : null,
    });
  }

  async slugExistsInBlog(blogId, slug, excludePostId = null) {
    const where = { blogId, slug };
    if (excludePostId) where.id = { [Op.ne]: excludePostId };
    const count = await this.model.count({ where });
    return count > 0;
  }

  async findAllByAuthor(authorId, blogId) {
    return await this.model.findAll({
      where: { authorId, blogId },
      order: [["createdAt", "DESC"]],
    });
  }

  async searchAndDiscover(options = {}) {
    const { query, blogSlug, sortBy = "latest", limit = 10, offset = 0 } = options;

    const where = { status: "published" };

    // Search by keyword in title, contentHtml, or excerpt
    if (query) {
      const searchVal = `%${query.toLowerCase()}%`;
      where[Op.or] = [
        sequelize.where(sequelize.fn("LOWER", sequelize.col("Post.title")), "LIKE", searchVal),
        sequelize.where(sequelize.fn("LOWER", sequelize.col("Post.excerpt")), "LIKE", searchVal),
        sequelize.where(sequelize.fn("LOWER", sequelize.col("Post.content_html")), "LIKE", searchVal),
      ];
    }

    // Filter by blogSlug if provided
    if (blogSlug) {
      const blog = await Blog.findOne({ where: { slug: blogSlug } });
      if (blog) {
        where.blogId = blog.id;
      } else {
        return { rows: [], count: 0 };
      }
    }

    // Sort mapping
    let order = [["publishedAt", "DESC"]];
    if (sortBy === "popular") {
      order = [["viewCount", "DESC"], ["publishedAt", "DESC"]];
    }

    return await this.model.findAndCountAll({
      where,
      include: postListIncludes,
      attributes: { exclude: ["contentHtml"] },
      order,
      limit,
      offset,
    });
  }
}
