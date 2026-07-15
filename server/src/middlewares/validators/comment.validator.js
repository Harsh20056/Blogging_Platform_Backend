import { AppError } from "../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// ADD COMMENT validator
// POST /api/v1/comments/:postId
// Body: { body }
// Story #31
export const addCommentValidator = createValidator((req) => {
  const { body } = req.body;

  if (body === undefined || body === null || body === "") {
    throw new AppError("Comment body is required", 400);
  }

  if (typeof body !== "string") {
    throw new AppError("Comment body must be a string", 400);
  }

  if (body.trim().length < 1) {
    throw new AppError("Comment cannot be empty", 400);
  }

  if (body.trim().length > 2000) {
    throw new AppError("Comment cannot exceed 2000 characters", 400);
  }
});

// UPDATE COMMENT validator
// PATCH /api/v1/comments/:commentId
// Body: { body }
// Story #33
export const updateCommentValidator = createValidator((req) => {
  const { body } = req.body;

  if (body === undefined || body === null || body === "") {
    throw new AppError("Comment body is required", 400);
  }

  if (typeof body !== "string") {
    throw new AppError("Comment body must be a string", 400);
  }

  if (body.trim().length < 1) {
    throw new AppError("Comment cannot be empty", 400);
  }

  if (body.trim().length > 2000) {
    throw new AppError("Comment cannot exceed 2000 characters", 400);
  }
});
