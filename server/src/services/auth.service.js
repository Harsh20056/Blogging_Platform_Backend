import crypto from "crypto"; // Node built-in — no install needed
import { AuthRepository } from "../repositories/auth.repository.js";
import { AppError } from "../utils/AppError.js";
import { BcryptHelper } from "../utils/bcrypt.js";
import { JwtHelper } from "../utils/jwt.js";

const authRepo = new AuthRepository();

export class AuthService {

  async register(payload) {
    const email = payload.email?.toLowerCase().trim();
    const username = payload.username?.trim();
    const password = payload.password;

    if (!email) throw new AppError("Email is required", 400);
    if (!username) throw new AppError("Username is required", 400);
    if (!password) throw new AppError("Password is required", 400);

    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const emailTaken = await authRepo.findByEmail(email);
    if (emailTaken) throw new AppError("Email is already in use", 409);

    const usernameTaken = await authRepo.findByUsername(username);
    if (usernameTaken) throw new AppError("Username is already taken", 409);

    const hashedPassword = await BcryptHelper.hashPassword(password);

    const user = await authRepo.createUser({
      email,
      username,
      password: hashedPassword,
      fullName: payload.fullName?.trim() || null,
    });

    return this.formatUser(user);
  }

  async login(email, password) {
    const trimmedEmail = email?.toLowerCase().trim();

    if (!trimmedEmail) throw new AppError("Email is required", 400);
    if (!password) throw new AppError("Password is required", 400);

    const user = await authRepo.findByEmail(trimmedEmail);

    if (!user) throw new AppError("Invalid email or password", 401);

    const isPasswordValid = await BcryptHelper.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403);
    }
    if (user.status === "banned") {
      throw new AppError("Your account has been banned", 403);
    }

    await authRepo.updateLastLogin(user.id);

    const token = JwtHelper.generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user: this.formatUser(user),
      token,
    };
  }

  async logout() {
    // Future: push token to a Redis blacklist here
    return true;
  }

  async getMe(userId) {
    const user = await authRepo.findById(userId);
    return this.formatUser(user);
  }

  async forgotPassword(email) {
    const trimmedEmail = email?.toLowerCase().trim();
    if (!trimmedEmail) throw new AppError("Email is required", 400);

    const user = await authRepo.findByEmail(trimmedEmail);
    if (!user) {
      return {
        message:
          "If an account with that email exists, a reset link has been sent.",
      };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await authRepo.savePasswordResetToken(user.id, hashedToken, expiresAt);

    return {
      message:
        "If an account with that email exists, a reset link has been sent.",
      resetToken: rawToken,
    };
  }

  async resetPassword(rawToken, newPassword) {
    if (!rawToken) throw new AppError("Reset token is required", 400);
    if (!newPassword) throw new AppError("New password is required", 400);

    if (newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await authRepo.findByResetToken(hashedToken);
    if (!user) {
      throw new AppError("Reset token is invalid or has expired", 400);
    }

    const hashedPassword = await BcryptHelper.hashPassword(newPassword);

    await authRepo.resetPassword(user.id, hashedPassword);

    return { message: "Password has been reset successfully. Please log in." };
  }

  formatUser(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      websiteUrl: user.websiteUrl,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}