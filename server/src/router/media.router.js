import express from "express";
import { MediaController } from "../controllers/media.controller.js";
import { identifyUser } from "../middlewares/security/index.js";
import { uploadPostImage } from "../middlewares/upload.middleware.js";

const router = express.Router();
const ctrl = new MediaController();

// All media endpoints require the user to be logged in (as a Blog Creator)

// Upload media image
router.post("/", identifyUser, uploadPostImage, ctrl.upload);

//  List previously uploaded media images
router.get("/", identifyUser, ctrl.list);

// Delete media image
router.delete("/:id", identifyUser, ctrl.delete);

export default router;
