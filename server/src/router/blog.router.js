import express from "express";
import { BlogController } from "../controllers/blog.controller.js";
import {
    createBlogValidator,
    updateBlogValidator,
} from "../middlewares/validators/blog.validator.js";
import { identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new BlogController();

router.get("/:slug", ctrl.getBySlug);

router.post("/", identifyUser, createBlogValidator, ctrl.create);
router.patch("/:slug", identifyUser, updateBlogValidator, ctrl.update);
router.delete("/:slug", identifyUser, ctrl.delete);

export default router;