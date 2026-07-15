import { AuthService } from "../services/auth.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  getTokenCookieName,
  getTokenCookieOptions,
  getTokenCookieClearOptions,
} from "../utils/cookie.js";

const authService = new AuthService();

export class AuthController {

  register = catchAsync(async (req, res) => {
    const data = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data,
    });
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const { user, token } = await authService.login(email, password);

    res.cookie(getTokenCookieName(), token, getTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  });

  logout = catchAsync(async (req, res) => {
    await authService.logout();

    res.clearCookie(getTokenCookieName(), getTokenCookieClearOptions());

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });

  getMe = catchAsync(async (req, res) => {
    const data = await authService.getMe(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  });

  forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const data = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      ...data,
    });
  });

  resetPassword = catchAsync(async (req, res) => {
    const { token, newPassword } = req.body;

    const data = await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      ...data,
    });
  });
}