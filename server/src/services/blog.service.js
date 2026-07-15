import { BlogRepository } from "../repositories/blog.repository.js";
import { AppError } from "../utils/AppError.js";

const blogRepo = new BlogRepository();

export class BlogService {

    async createBlog(payload, ownerId) {
        const existingBlog = await blogRepo.findByOwnerId(ownerId);
        if (existingBlog) {
            throw new AppError("You already have a blog. You can only create one.", 409);
        }

        const rawSlug = payload.slug?.trim() || this.generateSlug(payload.name);

        const slugTaken = await blogRepo.findBySlug(rawSlug);
        if (slugTaken) {
            throw new AppError(
                "This slug is already taken. Please choose a different one.",
                409
            );
        }

        const blog = await blogRepo.createBlog({
            ownerId,
            name: payload.name.trim(),
            slug: rawSlug,
            description: payload.description?.trim() || null,
            logoUrl: payload.logoUrl?.trim() || null,
            bannerUrl: payload.bannerUrl?.trim() || null,
            settings: payload.settings || {
                theme: "default",
                isCommentsEnabled: true,
                isPublic: true,
            },
        });

        return this.formatBlog(blog);
    }

    async getBlogBySlug(slug) {
        const blog = await blogRepo.findBySlugWithOwner(slug);

        if (!blog) throw new AppError("Blog not found", 404);

        return this.formatBlog(blog);
    }
    async updateBlog(slug, payload, requesterId) {
        const blog = await blogRepo.findBySlugWithOwner(slug);
        if (!blog) throw new AppError("Blog not found", 404);

        this.verifyOwnership(blog, requesterId);

        const updateData = {};

        if (payload.name !== undefined) {
            updateData.name = payload.name.trim();
        }

        if (payload.description !== undefined) {
            updateData.description = payload.description?.trim() || null;
        }

        if (payload.logoUrl !== undefined) {
            updateData.logoUrl = payload.logoUrl?.trim() || null;
        }

        if (payload.bannerUrl !== undefined) {
            updateData.bannerUrl = payload.bannerUrl?.trim() || null;
        }

        if (payload.slug !== undefined) {
            const newSlug = payload.slug.trim();

            if (newSlug !== blog.slug) {
                const slugTaken = await blogRepo.findBySlug(newSlug);
                if (slugTaken) {
                    throw new AppError(
                        "This slug is already taken. Please choose a different one.",
                        409
                    );
                }
                updateData.slug = newSlug;
            }
        }

        if (payload.settings !== undefined) {
            updateData.settings = {
                ...blog.settings,
                ...payload.settings,
            };
        }

        if (Object.keys(updateData).length === 0) {
            throw new AppError("No valid fields provided to update", 400);
        }

        const updated = await blogRepo.updateBlog(blog.id, updateData);
        return this.formatBlog(updated);
    }

    async deleteBlog(slug, requesterId) {
        const blog = await blogRepo.findBySlugWithOwner(slug);
        if (!blog) throw new AppError("Blog not found", 404);

        this.verifyOwnership(blog, requesterId);

        await blogRepo.deleteBlog(blog.id);

        return { message: "Blog deleted successfully" };
    }

    async resolveBlogBySlug(slug) {
        const blog = await blogRepo.findBySlugWithOwner(slug);
        if (!blog) throw new AppError("Blog not found", 404);
        return blog;
    }

    generateSlug(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
            .replace(/\s+/g, "-")           // spaces → hyphens
            .replace(/-+/g, "-")            // collapse multiple hyphens
            .replace(/^-|-$/g, "");         // trim leading/trailing hyphens
    }

    verifyOwnership(blog, requesterId) {
        if (blog.ownerId !== requesterId) {
            throw new AppError(
                "Forbidden. You do not have permission to modify this blog.",
                403
            );
        }
    }

    formatBlog(blog) {
        return {
            id: blog.id,
            name: blog.name,
            slug: blog.slug,
            description: blog.description,
            logoUrl: blog.logoUrl,
            bannerUrl: blog.bannerUrl,
            settings: blog.settings,
            isActive: blog.isActive,
            owner: blog.owner
                ? {
                    id: blog.owner.id,
                    username: blog.owner.username,
                    fullName: blog.owner.fullName,
                    avatarUrl: blog.owner.avatarUrl,
                }
                : null,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
        };
    }
}