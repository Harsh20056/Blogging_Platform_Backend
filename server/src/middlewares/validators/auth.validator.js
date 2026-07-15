import { AppError } from "../../utils/AppError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/; // letters, numbers, _ and - only

// Wraps every validator — catches thrown AppErrors and passes to global handler
const createValidator = (validateFn) => (req, res, next) => {
    try {
        validateFn(req);
        next();
    } catch (error) {
        next(error);
    }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
    if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
        throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
    }
};

const ensureEmail = (value) => {
    if (typeof value !== "string" || !EMAIL_REGEX.test(value.trim())) {
        throw new AppError("Please provide a valid email address", 400);
    }
};

const ensureRequired = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
        throw new AppError(`${fieldName} is required`, 400);
    }
};

// REGISTER validator
// POST /auth/register
// Body: { username, email, password, fullName? }
export const registerValidator = createValidator((req) => {
    const { username, email, password, fullName } = req.body;

    // Required fields
    ensureRequired(username, "username");
    ensureRequired(email, "email");
    ensureRequired(password, "password");

    // username — 3 to 30 chars, only allowed characters
    ensureString(username, "username", { min: 3, max: 30 });
    if (!USERNAME_REGEX.test(username.trim())) {
        throw new AppError(
            "Username can only contain letters, numbers, underscores and hyphens",
            400
        );
    }

    // email format
    ensureEmail(email);

    // password — min 8 chars
    ensureString(password, "password", { min: 8, max: 72 });
    // 72 is bcrypt's max effective length

    // fullName — optional but if sent, must be valid
    if (fullName !== undefined) {
        ensureString(fullName, "fullName", { min: 2, max: 100 });
    }
});

// LOGIN validator
// POST /auth/login
// Body: { email, password }
export const loginValidator = createValidator((req) => {
    const { email, password } = req.body;

    ensureRequired(email, "email");
    ensureRequired(password, "password");

    ensureEmail(email);

    // Only check presence — don't give hints about password rules on login
    ensureString(password, "password", { min: 1, max: 255 });
});

// FORGOT PASSWORD validator
// POST /auth/forgot-password
// Body: { email }
export const forgotPasswordValidator = createValidator((req) => {
    const { email } = req.body;

    ensureRequired(email, "email");
    ensureEmail(email);
});

// RESET PASSWORD validator
// POST /auth/reset-password
// Body: { token, newPassword }
export const resetPasswordValidator = createValidator((req) => {
    const { token, newPassword } = req.body;

    ensureRequired(token, "token");
    ensureRequired(newPassword, "newPassword");

    // token is a 64-char hex string (32 bytes from crypto.randomBytes)
    ensureString(token, "token", { min: 64, max: 64 });

    // Enforce strong password on reset
    ensureString(newPassword, "newPassword", { min: 8, max: 72 });
});