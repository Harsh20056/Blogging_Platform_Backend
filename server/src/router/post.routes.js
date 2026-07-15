import express from "express";
import { PostController } from "../controllers/post.controllers.js";
import { LikeController } from "../controllers/like.controller.js";
import { identifyUser, optionalAuth } from "../middlewares/security/index.js";
import {
  createPostValidator,
  updatePostValidator,
} from "../middlewares/validators/post.validator.js";

const router = express.Router({ mergeParams: true });
// mergeParams: true lets us inherit :blogSlug from the parent router if needed

const ctrl = new PostController();
const likeCtrl = new LikeController();

// list published posts for a blog
router.get("/:blogSlug", ctrl.listPosts);

//  View Like Count / Status
router.get("/:blogSlug/:postSlug/likes", optionalAuth, likeCtrl.getLikeInfo);

//View who liked a post
router.get("/:blogSlug/:postSlug/likes/users", likeCtrl.getLikers);


// optionalAuth: unauthenticated readers see published posts; owners also see drafts
router.get("/:blogSlug/:postSlug", optionalAuth, ctrl.getPost);

//  create post or save as draft
router.post("/:blogSlug", identifyUser, createPostValidator, ctrl.create);

// Like Post
router.post("/:blogSlug/:postSlug/like", identifyUser, likeCtrl.like);

// Unlike Post
router.delete("/:blogSlug/:postSlug/like", identifyUser, likeCtrl.unlike);

//  update post
router.patch("/:blogSlug/:postSlug", identifyUser, updatePostValidator, ctrl.update);

// delete post (soft delete)
router.delete("/:blogSlug/:postSlug", identifyUser, ctrl.delete);

// publish
router.patch("/:blogSlug/:postSlug/publish", identifyUser, ctrl.publish);

//  unpublish (move back to draft)
router.patch("/:blogSlug/:postSlug/unpublish", identifyUser, ctrl.unpublish);

export default router;
