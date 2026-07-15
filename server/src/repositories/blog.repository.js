import { User } from "../models/index.js";
import { Blog } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class BlogRepository extends BaseRepository {
    constructor() {
        super(Blog);
    }

    async findByOwnerId(ownerId) {
        return await this.model.findOne({
            where: { ownerId },
        });
    }

    async findBySlug(slug) {
        return await this.model.findOne({
            where: { slug },
            include: [
                {
                    model: User,
                    as: "owner",
                    attributes: ["id", "username", "fullName", "avatarUrl"],
                },
            ],
        });
    }

    async createBlog(data) {
        return await this.model.create(data);
    }

    async findById(id) {
        const blog = await this.model.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "owner",
                    attributes: ["id", "username", "fullName", "avatarUrl"],
                },
            ],
        });

        if (!blog) throw new AppError("Blog not found", 404);
        return blog;
    }

    async findBySlugWithOwner(slug) {
        return await this.model.findOne({
            where: { slug },
            include: [
                {
                    model: User,
                    as: "owner",
                    attributes: ["id", "username", "fullName", "avatarUrl"],
                },
            ],
        });
    }

    async updateBlog(id, data) {
        const blog = await this.findById(id);
        return await blog.update(data);
    }

    async deleteBlog(id) {
        const blog = await this.findById(id);
        return await blog.destroy();
    }
}