import express from "express";
import { connectWithRetry as connectDB } from "./config/db.js";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error/error.middleware.js";
import authRouter from "./router/auth.router.js";
import blogRouter from "./router/blog.router.js";
import profileRouter from "./router/profile.router.js";
import postRouter from "./router/post.routes.js";
import commentRouter from "./router/comment.router.js";
import mediaRouter from "./router/media.router.js";
import searchRouter from "./router/search.router.js";

const app = express();
connectDB();

app.use(
  cors({
    origin:
      process.env.NODE_ENV == "production"
        ? process.env.FRONTEND_PROD_URL
        : process.env.FRONTEND_DEV_URL,
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(cookieParser());
// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/search", searchRouter);

app.use(errorMiddleware);
export default app;
