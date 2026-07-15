import { PostRepository } from "../repositories/post.repository.js";

const postRepo = new PostRepository();

export class SearchService {
  async searchPosts(options = {}) {
    const query = options.query?.trim() || "";
    const blogSlug = options.blogSlug?.trim() || null;
    const sortBy = options.sortBy === "popular" ? "popular" : "latest";

    const page = Math.max(parseInt(options.page) || 1, 1);
    const limit = Math.min(parseInt(options.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { rows, count } = await postRepo.searchAndDiscover({
      query,
      blogSlug,
      sortBy,
      limit,
      offset,
    });

    const posts = rows.map((post) => ({
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
    }));

    return {
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      posts,
    };
  }
}
