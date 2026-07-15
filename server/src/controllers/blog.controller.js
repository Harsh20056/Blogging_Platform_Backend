import { BlogService } from "../services/blog.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const blogService = new BlogService();

export class BlogController {

    create = catchAsync(async (req, res) => {
        const data = await blogService.createBlog(req.body, req.user.id);

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data,
        });
    });

    getBySlug = catchAsync(async (req, res) => {
        const data = await blogService.getBlogBySlug(req.params.slug);

        res.status(200).json({
            success: true,
            data,
        });
    });

    update = catchAsync(async (req, res) => {
        const data = await blogService.updateBlog(
            req.params.slug,
            req.body,
            req.user.id
        );

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            data,
        });
    });

    delete = catchAsync(async (req, res) => {
        const data = await blogService.deleteBlog(req.params.slug, req.user.id);

        res.status(200).json({
            success: true,
            ...data,
        });
    });
}