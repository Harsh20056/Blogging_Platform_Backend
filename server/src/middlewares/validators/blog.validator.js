import { AppError } from "../../utils/AppError.js";

const SLUG_REGEX = /^[a-z0-9-]+$/; // only lowercase, numbers, hyphens
const URL_REGEX  = /^https?:\/\/.+/;

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

const ensureOptionalUrl = (value, fieldName) => {
  if (value === undefined || value === null) return;
  if (typeof value !== "string" || !URL_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid URL starting with http:// or https://`, 400);
  }
};

const ensureOptionalObject = (value, fieldName) => {
  if (value === undefined || value === null) return;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object`, 400);
  }
};

// CREATE BLOG
// Body: { name, slug?, description?, logoUrl?, bannerUrl?, settings? }
export const createBlogValidator = createValidator((req) => {
  const { name, slug, description, logoUrl, bannerUrl, settings } = req.body;

  // name is the only required field
  if (!name) throw new AppError("Blog name is required", 400);
  ensureString(name, "name", { min: 3, max: 100 });

  // slug is optional — auto-generated from name if not sent
  if (slug !== undefined) {
    ensureString(slug, "slug", { min: 3, max: 100 });
    if (!SLUG_REGEX.test(slug.trim())) {
      throw new AppError(
        "Slug can only contain lowercase letters, numbers, and hyphens",
        400
      );
    }
  }

  // All other fields are optional
  if (description !== undefined) {
    ensureString(description, "description", { min: 1, max: 500 });
  }

  ensureOptionalUrl(logoUrl, "logoUrl");
  ensureOptionalUrl(bannerUrl, "bannerUrl");
  ensureOptionalObject(settings, "settings");
});

// UPDATE BLOG
// Body: any combination of { name?, slug?, description?, logoUrl?, bannerUrl?, settings? }
// At least one field required
export const updateBlogValidator = createValidator((req) => {
  const { name, slug, description, logoUrl, bannerUrl, settings } = req.body;

  // Must send at least one field
  const hasAnyField = [name, slug, description, logoUrl, bannerUrl, settings]
    .some((v) => v !== undefined);

  if (!hasAnyField) {
    throw new AppError("Please provide at least one field to update", 400);
  }

  if (name !== undefined) {
    ensureString(name, "name", { min: 3, max: 100 });
  }

  if (slug !== undefined) {
    ensureString(slug, "slug", { min: 3, max: 100 });
    if (!SLUG_REGEX.test(slug.trim())) {
      throw new AppError(
        "Slug can only contain lowercase letters, numbers, and hyphens",
        400
      );
    }
  }

  if (description !== undefined) {
    ensureString(description, "description", { min: 1, max: 500 });
  }

  ensureOptionalUrl(logoUrl, "logoUrl");
  ensureOptionalUrl(bannerUrl, "bannerUrl");
  ensureOptionalObject(settings, "settings");
});