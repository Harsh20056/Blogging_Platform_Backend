import { AppError } from "../../utils/AppError.js";

const URL_REGEX = /^https?:\/\/.+\..+/;

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

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureString(value, fieldName, options);
};

const ensurePlainObject = (value, fieldName) => {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object`, 400);
  }
};

// UPDATE MY PROFILE validator
// PATCH /api/v1/profile/me
// Body: { fullName?, bio?, websiteUrl?, preferences? }
// Blocks any sensitive fields from being passed through this endpoint
export const updateProfileValidator = createValidator((req) => {
  const { body } = req;

  // Block sensitive fields — these have their own dedicated endpoints
  const blocked = ["email", "password", "status", "username", "isEmailVerified"];
  for (const field of blocked) {
    if (body[field] !== undefined) {
      throw new AppError(
        `'${field}' cannot be updated via this endpoint`,
        400
      );
    }
  }

  // Optional: fullName
  if (body.fullName !== undefined) {
    ensureOptionalString(body.fullName, "fullName", { min: 2, max: 100 });
  }

  // Optional: bio (can be up to 500 chars, and can be cleared with empty string)
  if (body.bio !== undefined && body.bio !== null && body.bio !== "") {
    ensureString(body.bio, "bio", { min: 1, max: 500 });
  }

  // Optional: websiteUrl — must be a valid URL if provided
  if (body.websiteUrl !== undefined && body.websiteUrl !== null && body.websiteUrl !== "") {
    ensureString(body.websiteUrl, "websiteUrl", { min: 1, max: 500 });
    if (!URL_REGEX.test(body.websiteUrl.trim())) {
      throw new AppError("websiteUrl must be a valid URL (e.g. https://example.com)", 400);
    }
  }

  // Optional: preferences object
  if (body.preferences !== undefined) {
    ensurePlainObject(body.preferences, "preferences");

    // Validate nested preference fields if provided
    if (body.preferences.theme !== undefined) {
      const validThemes = ["light", "dark", "system"];
      if (!validThemes.includes(body.preferences.theme)) {
        throw new AppError(`preferences.theme must be one of: ${validThemes.join(", ")}`, 400);
      }
    }

    if (body.preferences.language !== undefined) {
      ensureString(body.preferences.language, "preferences.language", { min: 2, max: 10 });
    }
  }
});
