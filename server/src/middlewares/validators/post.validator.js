import { AppError } from "../../utils/AppError.js";

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

const ensureRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    throw new AppError(`${fieldName} is required`, 400);
  }
};

const ensureOptionalUrl = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return;
  if (typeof value !== "string" || !/^https?:\/\/.+/.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid URL starting with http:// or https://`, 400);
  }
};

// CREATE POST validator
// POST /api/v1/posts/:blogSlug
// Body: { title, contentHtml?, excerpt?, coverImageUrl?, tags?, status? }
// Story #15 (publish immediately) & Story #21 (save as draft)
export const createPostValidator = createValidator((req) => {
  const { title, contentHtml, excerpt, coverImageUrl, tags, status } = req.body;

  // title is the only required field
  ensureRequired(title, "title");
  ensureString(title, "title", { min: 3, max: 200 });

  // contentHtml is optional on draft, but must be a string if provided
  if (contentHtml !== undefined) {
    if (typeof contentHtml !== "string") {
      throw new AppError("contentHtml must be a string", 400);
    }
  }

  // excerpt — short plain-text summary
  if (excerpt !== undefined) {
    ensureString(excerpt, "excerpt", { min: 1, max: 500 });
  }

  // coverImageUrl — must be a valid URL if provided
  ensureOptionalUrl(coverImageUrl, "coverImageUrl");

  // tags — must be an array of strings
  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      throw new AppError("tags must be an array of strings", 400);
    }
    if (tags.length > 10) {
      throw new AppError("You can add at most 10 tags", 400);
    }
    for (const tag of tags) {
      if (typeof tag !== "string" || tag.trim().length === 0 || tag.trim().length > 50) {
        throw new AppError("Each tag must be a non-empty string up to 50 characters", 400);
      }
    }
  }

  // status — only "draft" or "published" are valid on create
  if (status !== undefined) {
    if (!["draft", "published"].includes(status)) {
      throw new AppError("status must be either 'draft' or 'published'", 400);
    }
  }
});

// UPDATE POST validator
// PATCH /api/v1/posts/:blogSlug/:postSlug
// Body: any combination of { title?, contentHtml?, excerpt?, coverImageUrl?, tags? }
// Story #18
export const updatePostValidator = createValidator((req) => {
  const { title, contentHtml, excerpt, coverImageUrl, tags } = req.body;

  // At least one field must be provided
  const hasAnyField = [title, contentHtml, excerpt, coverImageUrl, tags]
    .some((v) => v !== undefined);

  if (!hasAnyField) {
    throw new AppError("Please provide at least one field to update", 400);
  }

  if (title !== undefined) {
    ensureString(title, "title", { min: 3, max: 200 });
  }

  if (contentHtml !== undefined && typeof contentHtml !== "string") {
    throw new AppError("contentHtml must be a string", 400);
  }

  if (excerpt !== undefined) {
    ensureString(excerpt, "excerpt", { min: 1, max: 500 });
  }

  ensureOptionalUrl(coverImageUrl, "coverImageUrl");

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      throw new AppError("tags must be an array of strings", 400);
    }
    if (tags.length > 10) {
      throw new AppError("You can add at most 10 tags", 400);
    }
    for (const tag of tags) {
      if (typeof tag !== "string" || tag.trim().length === 0 || tag.trim().length > 50) {
        throw new AppError("Each tag must be a non-empty string up to 50 characters", 400);
      }
    }
  }
});
