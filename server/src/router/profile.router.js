import express from "express";
import { ProfileController } from "../controllers/profile.controller.js";
import { identifyUser } from "../middlewares/security/index.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import { updateProfileValidator } from "../middlewares/validators/profile.validator.js";

const router = express.Router();
const ctrl = new ProfileController();

//  View my own profile
router.get("/me", identifyUser, ctrl.getMyProfile);

// Update profile text fields
router.patch("/me", identifyUser, updateProfileValidator, ctrl.updateMyProfile);

// Upload avatar (multipart/form-data, field name: "avatar")
router.post("/me/avatar", identifyUser, uploadAvatar, ctrl.uploadAvatar);

// View a creator's public profile by username
router.get("/:username", ctrl.getPublicCreatorProfile);

export default router;
