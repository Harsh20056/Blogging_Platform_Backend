import express from "express";
import { AuthController } from "../controllers/auth.controllers.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../middlewares/validators/auth.validator.js";
import { identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new AuthController();

router.post("/register", registerValidator, ctrl.register);
router.post("/login", loginValidator, ctrl.login);
router.post("/forgot-password", forgotPasswordValidator, ctrl.forgotPassword);
router.post("/reset-password", resetPasswordValidator, ctrl.resetPassword);

router.post("/logout", identifyUser, ctrl.logout);
router.get("/me", identifyUser, ctrl.getMe);

export default router;