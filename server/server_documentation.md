# Technical Documentation: BlogSphere Backend Service

This document provides a comprehensive technical overview of the **BlogSphere** multi-tenant blogging platform backend.

---

## Table of Contents
*   [1. Project Overview](#1-project-overview) ..................................................... Page 3
*   [2. Folder Structure](#2-folder-structure) ..................................................... Page 4
*   [3. Authentication & Authorization](#3-authentication--authorization) ....................................... Page 6
*   [4. Modules](#4-modules) .............................................................. Page 7
*   [5. API Reference](#5-api-reference) ........................................................ Page 8
    *   [Authentication Module](#authentication-module) .............................................. Page 8
    *   [Profile Management Module](#profile-management-module) .......................................... Page 10
    *   [Blog Management Module](#blog-management-module) ............................................. Page 12
    *   [Post Management Module](#post-management-module) ............................................. Page 14
    *   [Comment Management Module](#comment-management-module) .......................................... Page 17
    *   [Engagement / Like Module](#engagement--like-module) ........................................... Page 19
    *   [Media Management Module](#media-management-module) ............................................ Page 21
    *   [Search & Discovery Module](#search--discovery-module) .......................................... Page 23
*   [6. Database Schema](#6-database-schema) ...................................................... Page 24
*   [7. Error Handling](#7-error-handling) ....................................................... Page 26
*   [8. Environment Variables](#8-environment-variables) ................................................ Page 27

---

## 1. Project Overview

### Purpose & Problem Solved
**BlogSphere** is a multi-tenant blogging platform. It allows users to read blogs and register as Blog Creators to run their own individual blogs. The backend manages users, blogs, posts, comments, likes, and image uploads, serving as a single source of truth for the platform.

### Tech Stack & Core Libraries
Based on [package.json](file:///c:/Training_Coding/server/package.json), the backend utilizes:
*   **Runtime & Server Framework**: Node.js (ES Modules) with Express.js `v5.2.1`
*   **Database & ORM**: PostgreSQL database driven by Sequelize `v6.37.8` and the `pg` client `v8.22.0`
*   **Authentication & Hashing**: JSON Web Tokens (JWT) via `jsonwebtoken` `v9.0.3`, custom cookie parsing via `cookie-parser` `v1.4.7`, and passwords hashed with `bcrypt` `v6.0.0`
*   **Media Management**: Multer `v2.2.0` for memory storage uploads, and Cloudinary SDK `v1.41.3` for cloud asset hosting
*   **Input Validation & Security**: Custom validator rules with Zod `v4.4.3` (installed but validation logic is custom) and `sanitize-html` `v2.17.5` for XSS protection

### Architectural Pattern
The backend is structured around a **Controller-Service-Repository-Model** pattern:
*   **Routes** ([src/router](file:///c:/Training_Coding/server/src/router)): Intercept HTTP requests, apply auth/validator middlewares, and forward inputs.
*   **Controllers** ([src/controllers](file:///c:/Training_Coding/server/src/controllers)): Extract inputs (params, body, user state), invoke business services, and send standard JSON responses.
*   **Services** ([src/services](file:///c:/Training_Coding/server/src/services)): Perform business validations, data formatting, external integrations (Cloudinary), and enforce operations rules.
*   **Repositories** ([src/repositories](file:///c:/Training_Coding/server/src/repositories)): Isolate Sequelize SQL queries, extending a generic [base.repository.js](file:///c:/Training_Coding/server/src/repositories/base.repository.js).
*   **Models** ([src/models](file:///c:/Training_Coding/server/src/models)): Define database schemas, scopes, associations, and indexes.

### Multi-Tenancy & Tenant Isolation
BlogSphere supports a **shared-database, shared-schema** multi-tenancy model:
*   **Isolation Entity**: The "Tenant" is a `Blog` owned by a user (Blog Creator). Each user can own at most **one** blog.
*   **Isolation Enforcer**: Database tables representing tenant assets (`posts`) contain a foreign key `blog_id`. 
*   **Verification**: For every write, modification, or access to sensitive tenant assets (like draft posts), the service layer resolves the target blog by slug and verifies if the authenticated user's ID matches the blog's `owner_id`. If they do not match, the operation is blocked with a `403 Forbidden` response.

---

## 2. Folder Structure

Below is the annotated file tree of the [server](file:///c:/Training_Coding/server) directory structure:

```
server/
├── .env                              # Env configs & database URI
├── .gitignore                        # Git ignore file
├── package-lock.json                 # Lock file for package dependencies
├── package.json                      # Build scripts and dependency manifest
├── server.js                         # Starts Express listener
└── src/                              # Main application source folder
    ├── app.js                        # App setup & route registrations
    ├── config/                       # Core configurations
    │   ├── cloudinary.js             # Cloudinary asset storage config
    │   ├── constants.js              # App-wide constants
    │   └── db.js                     # Sequelize & database setup
    ├── controllers/                  # HTTP route handlers
    │   ├── auth.controllers.js       # Auth controller
    │   ├── blog.controller.js        # Blog controller
    │   ├── comment.controller.js     # Comment controller
    │   ├── like.controller.js        # Like controller
    │   ├── media.controller.js       # Media upload controller
    │   ├── post.controllers.js       # Post controller
    │   ├── profile.controller.js     # Profile controller
    │   └── search.controller.js      # Search controller
    ├── middlewares/                  # Intermediary request interceptors
    │   ├── upload.middleware.js      # Multer file upload setup
    │   ├── error/
    │   │   └── error.middleware.js   # Global error handling
    │   ├── security/
    │   │   └── index.js              # JWT auth verification
    │   └── validators/               # Input validator rules
    │       ├── auth.validator.js     # Auth validators
    │       ├── blog.validator.js     # Blog validators
    │       ├── comment.validator.js  # Comment validators
    │       ├── post.validator.js     # Post validators
    │       └── profile.validator.js  # Profile validators
    ├── models/                       # Database models definitions
    │   ├── index.js                  # Model relationships declaration
    │   ├── Blog.js                   # Blog schema
    │   ├── Comment.js                # Comment schema
    │   ├── Like.js                   # Like/Reaction join schema
    │   ├── Media.js                  # Media file metadata schema
    │   ├── Post.js                   # Post schema
    │   └── User.js                   # User schema
    ├── repositories/                 # Sequelize queries abstraction
    │   ├── auth.repository.js        # User model queries
    │   ├── base.repository.js        # Base repository class
    │   ├── blog.repository.js        # Blog model queries
    │   ├── comment.repository.js     # Comment model queries
    │   ├── like.repository.js        # Like model queries
    │   ├── media.repository.js       # Media model queries
    │   ├── post.repository.js        # Post model queries
    │   └── profile.repository.js     # Profile model queries
    ├── router/                       # API route declarations
    │   ├── auth.router.js            # Auth routes
    │   ├── blog.router.js            # Blog routes
    │   ├── comment.router.js         # Comment routes
    │   ├── media.router.js           # Media routes
    │   ├── post.routes.js            # Post routes
    │   ├── profile.router.js         # Profile routes
    │   └── search.router.js          # Search routes
    ├── services/                     # Core business logic layer
    │   ├── auth.service.js           # Auth services
    │   ├── blog.service.js           # Blog services
    │   ├── comment.service.js        # Comment services
    │   ├── like.service.js           # Like services
    │   ├── media.service.js          # Media storage services
    │   ├── post.service.js           # Post services
    │   ├── profile.service.js        # Profile services
    │   └── search.service.js         # Search services
    └── utils/                        # Shared helper functions
        ├── AppError.js               # Custom operational Error class
        ├── bcrypt.js                 # Bcrypt hashing wrappers
        ├── catchAsync.js             # Async controller error catcher
        ├── cookie.js                 # Auth cookie helper
        ├── jwt.js                    # JWT signing & verifying
        └── sanitizePostContent.js    # HTML sanitization helper
```

---

## 3. Authentication & Authorization

### Auth Strategy & Token Flow
*   **Bearer / Cookie Session**: The platform uses stateless JSON Web Token (JWT) authorization.
*   **Cookie Delivery**: Upon successful login, the server sets a secure, `httpOnly` cookie named `token`. The cookie is configured with `sameSite: Lax` (or `None` in production) and `secure: true` (in production).
*   **Authorization Header**: In addition to cookies, the server accepts the token via the HTTP `Authorization` header using the `Bearer <token>` format.
*   **Token Verification**: Handled by the custom middleware [identifyUser](file:///c:/Training_Coding/server/src/middlewares/security/index.js#L3). If valid, user metadata (id, email, username) is attached to `req.user`.

### Role Model
BlogSphere implements a dynamic, 2-role model determined by blog ownership:
1.  **Reader**: Any guest or registered user who does not own a blog. Readers can read published posts, like posts, and write comments.
2.  **Blog Creator**: Any registered user who has created a blog. They retain ownership of that blog and are authorized to write, update, delete, publish, and manage media for it.

### Enforcing Roles & Ownership Rules
*   **Auth Requirement**: Restricted endpoints utilize `identifyUser` to block unauthenticated access.
*   **Ownership Check**: Whenever a Blog Creator attempts to modify a blog, post, or media asset, the service layer retrieves the resource, compares `resource.ownerId` (or `blog.ownerId`) against `req.user.id`, and throws a `403 Forbidden` error if they do not match.
*   **Asset Previews**: Public post reads use `optionalAuth`. This allows the blog owner to view draft posts (previews) while restricting standard Readers to published posts only.

---

## 4. Modules

### 🔐 Authentication Module
Manages user registrations, logins, sessions, and secure password reset tokens.
*   `POST /api/v1/auth/register` (Register a new account)
*   `POST /api/v1/auth/login` (Authenticate and set JWT cookie)
*   `POST /api/v1/auth/forgot-password` (Generate password reset token)
*   `POST /api/v1/auth/reset-password` (Reset password using a token)
*   `POST /api/v1/auth/logout` (Clear authentication cookie)
*   `GET /api/v1/auth/me` (Retrieve current session details)

### 👤 Profile Management Module
Allows users to view profiles, edit preferences, update basic details, and change avatars.
*   `GET /api/v1/profile/me` (View own full profile details)
*   `PATCH /api/v1/profile/me` (Update details & UI preferences)
*   `POST /api/v1/profile/me/avatar` (Upload new profile avatar picture)
*   `GET /api/v1/profile/:username` (View a creator's public profile page)

### 🌐 Blog Management Module
Handles the lifecycle of a blog tenant configuration.
*   `POST /api/v1/blogs` (Create a blog — max one per user)
*   `GET /api/v1/blogs/:slug` (Get blog configuration and details)
*   `PATCH /api/v1/blogs/:slug` (Modify blog details or settings)
*   `DELETE /api/v1/blogs/:slug` (Delete blog and associated records)

### 📝 Post Management Module
Handles posts, drafts, XSS sanitizations, and slug generation.
*   `POST /api/v1/posts/:blogSlug` (Create a new post or save draft)
*   `GET /api/v1/posts/:blogSlug` (List published posts with pagination)
*   `GET /api/v1/posts/:blogSlug/:postSlug` (Read full post; supports owner previews)
*   `PATCH /api/v1/posts/:blogSlug/:postSlug` (Update post title, tags, or content)
*   `DELETE /api/v1/posts/:blogSlug/:postSlug` (Soft-delete a post)
*   `PATCH /api/v1/posts/:blogSlug/:postSlug/publish` (Publish a post)
*   `PATCH /api/v1/posts/:blogSlug/:postSlug/unpublish` (Revert a post to draft)

### 💬 Comment Management Module
Manages readers' comments on published posts.
*   `GET /api/v1/comments/:postId` (List comments with pagination)
*   `POST /api/v1/comments/:postId` (Add comment to a published post)
*   `PATCH /api/v1/comments/:commentId` (Update comment body)
*   `DELETE /api/v1/comments/:commentId` (Delete a comment)

### ❤️ Engagement / Like Module
Manages user likes on blog posts.
*   `GET /api/v1/posts/:blogSlug/:postSlug/likes` (Get post like count & user like status)
*   `GET /api/v1/posts/:blogSlug/:postSlug/likes/users` (List profiles of users who liked the post)
*   `POST /api/v1/posts/:blogSlug/:postSlug/like` (Like a published post)
*   `DELETE /api/v1/posts/:blogSlug/:postSlug/like` (Unlike a post)

### 🖼️ Media Management Module
Manages file uploads to Cloudinary storage.
*   `POST /api/v1/media` (Upload image file)
*   `GET /api/v1/media` (List user's previously uploaded images)
*   `DELETE /api/v1/media/:id` (Delete image from Cloudinary & DB)

### 🔍 Search & Discovery Module
Enables readers to search across all published posts by keyword, sort by latest or popularity, and paginate results.
*   `GET /api/v1/search` (Keyword search, sort, and paginate posts)

---

## 5. API Reference

---

### Authentication Module

#### `POST /api/v1/auth/register`
*   **Description**: Registers a new user account.
*   **Authentication**: None.
*   **Request Body**:
    *   `username` (String, Required): 3-30 chars, alphanumeric/hyphen/underscore.
    *   `email` (String, Required): Valid email format.
    *   `password` (String, Required): 8-72 chars.
    *   `fullName` (String, Optional): 2-100 chars.
*   **Example Request**:
    ```json
    {
      "username": "dev_creator",
      "email": "creator@blogsphere.com",
      "password": "SecurePassword123",
      "fullName": "Dev Creator"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Account created successfully",
      "data": {
        "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62",
        "username": "dev_creator",
        "email": "creator@blogsphere.com",
        "fullName": "Dev Creator",
        "status": "active",
        "isEmailVerified": false,
        "preferences": { "theme": "system", "language": "en", "emailNotifications": true },
        "createdAt": "2026-07-15T12:00:00.000Z",
        "updatedAt": "2026-07-15T12:00:00.000Z"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: `{"success": false, "message": "username must be between 3 and 30 characters"}`
    *   `409 Conflict`: `{"success": false, "message": "Email is already in use"}` or `{"success": false, "message": "Username is already taken"}`

#### `POST /api/v1/auth/login`
*   **Description**: Authenticates user and sets session token in HTTP cookie.
*   **Authentication**: None.
*   **Request Body**:
    *   `email` (String, Required): Valid email address.
    *   `password` (String, Required): Non-empty password string.
*   **Success Response (200 OK)**: Sets HTTP Cookie `token`.
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "user": {
          "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62",
          "username": "dev_creator",
          "email": "creator@blogsphere.com"
        },
        "token": "eyJhbGciOiJIUzI1NiIsIn..."
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: `{"success": false, "message": "Invalid email or password"}`
    *   `403 Forbidden`: `{"success": false, "message": "Your account has been suspended"}`

#### `POST /api/v1/auth/forgot-password`
*   **Description**: Generates password reset token.
*   **Authentication**: None.
*   **Request Body**:
    *   `email` (String, Required): Valid email.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "If an account with that email exists, a reset link has been sent.",
      "resetToken": "f784d12c8b9a4c8680323ffc83ab73e2300bf8a7bde3347b..."
    }
    ```

#### `POST /api/v1/auth/reset-password`
*   **Description**: Resets password using token.
*   **Authentication**: None.
*   **Request Body**:
    *   `token` (String, Required): Exactly 64 hex chars.
    *   `newPassword` (String, Required): 8-72 chars.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Password has been reset successfully. Please log in."
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: `{"success": false, "message": "Reset token is invalid or has expired"}`

#### `POST /api/v1/auth/logout`
*   **Description**: Standard logout; clears session token cookie.
*   **Authentication**: Yes (Reader or Blog Creator).
*   **Success Response (200 OK)**: Clears `token` cookie.
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

#### `GET /api/v1/auth/me`
*   **Description**: Gets profile details for the currently logged-in user.
*   **Authentication**: Yes.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62",
        "username": "dev_creator",
        "email": "creator@blogsphere.com",
        "fullName": "Dev Creator",
        "status": "active"
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: `{"success": false, "message": "Access denied. Please log in."}`

---

### Profile Management Module

#### `GET /api/v1/profile/me`
*   **Description**: Get full profile configurations.
*   **Authentication**: Yes.
*   **Success Response (200 OK)**: Returns full User JSON profile object.

#### `PATCH /api/v1/profile/me`
*   **Description**: Edit profile texts and UI settings.
*   **Authentication**: Yes.
*   **Request Body**:
    *   `fullName` (String, Optional): 2-100 chars.
    *   `bio` (String, Optional): 1-500 chars.
    *   `websiteUrl` (String, Optional): Valid URL starting with http:// or https://.
    *   `preferences` (Object, Optional): Theme (`"light" | "dark" | "system"`), Language (2-10 chars).
*   **Example Request**:
    ```json
    {
      "bio": "Senior Backend Developer specializing in Node.js",
      "preferences": {
        "theme": "dark"
      }
    }
    ```
*   **Success Response (200 OK)**: Returns updated user profile JSON object.
*   **Error Responses**:
    *   `400 Bad Request`: `{"success": false, "message": "'email' cannot be updated via this endpoint"}`

#### `POST /api/v1/profile/me/avatar`
*   **Description**: Upload profile avatar picture.
*   **Authentication**: Yes.
*   **Request Header**: `Content-Type: multipart/form-data`
*   **Request Body**: `avatar` (File, Required): Image file (jpeg, png, webp, gif), max 5MB.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Avatar uploaded successfully",
      "data": {
        "avatarUrl": "https://res.cloudinary.com/blogsphere/image/upload/..."
      }
    }
    ```

#### `GET /api/v1/profile/:username`
*   **Description**: Get public profile page of a blog creator.
*   **Authentication**: None.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62",
        "username": "dev_creator",
        "fullName": "Dev Creator",
        "bio": "Senior Backend Developer...",
        "avatarUrl": "https://res.cloudinary.com/...",
        "websiteUrl": "https://creator.dev",
        "memberSince": "2026-07-15T12:00:00.000Z"
      }
    }
    ```
*   **Error Responses**:
    *   `404 Not Found`: `{"success": false, "message": "User not found"}`

---

### Blog Management Module

#### `POST /api/v1/blogs`
*   **Description**: Instantiates a new blog tenant.
*   **Authentication**: Yes.
*   **Request Body**:
    *   `name` (String, Required): 3-100 chars.
    *   `slug` (String, Optional): 3-100 chars, format `^[a-z0-9-]+$`. Auto-generated from `name` if omitted.
    *   `description` (String, Optional): 1-500 chars.
    *   `logoUrl` (String, Optional): Valid URL.
    *   `bannerUrl` (String, Optional): Valid URL.
    *   `settings` (Object, Optional): Custom blog configurations.
*   **Example Request**:
    ```json
    {
      "name": "Node and Beyond",
      "slug": "node-and-beyond",
      "description": "API design tutorials"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Blog created successfully",
      "data": {
        "id": "58e23f03-62ef-4573-a8c9-58b29c9efd9a",
        "name": "Node and Beyond",
        "slug": "node-and-beyond",
        "description": "API design tutorials",
        "isActive": true,
        "owner": {
          "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62",
          "username": "dev_creator"
        }
      }
    }
    ```
*   **Error Responses**:
    *   `409 Conflict`: `{"success": false, "message": "You already have a blog. You can only create one."}` or `{"success": false, "message": "This slug is already taken. Please choose a different one."}`

#### `GET /api/v1/blogs/:slug`
*   **Description**: Get blog configurations and owner details.
*   **Authentication**: None.
*   **Success Response (200 OK)**: Returns the Blog JSON object with owner profiles.

#### `PATCH /api/v1/blogs/:slug`
*   **Description**: Update blog details or settings.
*   **Authentication**: Yes (Must own the blog).
*   **Request Body**: Any combination of `name`, `slug`, `description`, `logoUrl`, `bannerUrl`, `settings`.
*   **Success Response (200 OK)**: Returns updated Blog JSON object.
*   **Error Responses**:
    *   `403 Forbidden`: `{"success": false, "message": "Forbidden. You do not have permission to modify this blog."}`

#### `DELETE /api/v1/blogs/:slug`
*   **Description**: Delete blog and associated records.
*   **Authentication**: Yes (Must own the blog).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Blog deleted successfully"
    }
    ```

---

### Post Management Module

#### `POST /api/v1/posts/:blogSlug`
*   **Description**: Create a post inside a blog.
*   **Authentication**: Yes (Must own the target blog).
*   **Request Body**:
    *   `title` (String, Required): 3-200 chars.
    *   `contentHtml` (String, Optional): Markdown/HTML body text. Sanitized automatically.
    *   `excerpt` (String, Optional): 1-500 chars.
    *   `coverImageUrl` (String, Optional): Valid URL.
    *   `tags` (Array of Strings, Optional): Max 10 tags, each 1-50 chars.
    *   `status` (String, Optional): `"draft" | "published"`. Defaults to `"draft"`.
*   **Example Request**:
    ```json
    {
      "title": "Introduction to Sequelize",
      "contentHtml": "<p>Sequelize is a promise-based Node.js ORM...</p>",
      "tags": ["Sequelize", "Postgres"],
      "status": "published"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Post created and published",
      "data": {
        "id": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1",
        "title": "Introduction to Sequelize",
        "slug": "introduction-to-sequelize",
        "status": "published",
        "publishedAt": "2026-07-15T12:05:00.000Z"
      }
    }
    ```

#### `GET /api/v1/posts/:blogSlug`
*   **Description**: Get paginated list of published posts.
*   **Authentication**: None.
*   **Query Parameters**:
    *   `page` (Integer, Optional): Default `1`.
    *   `limit` (Integer, Optional): Default `10`, max `50`.
    *   `tag` (String, Optional): Filter by tag.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "blog": { "id": "58e23f03-62ef-4573-a8c9-58b29c9efd9a", "name": "Node and Beyond", "slug": "node-and-beyond" },
        "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 },
        "posts": [
          {
            "id": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1",
            "title": "Introduction to Sequelize",
            "slug": "introduction-to-sequelize",
            "excerpt": null,
            "coverImageUrl": null,
            "tags": ["sequelize", "postgres"],
            "status": "published",
            "viewCount": 0,
            "publishedAt": "2026-07-15T12:05:00.000Z"
          }
        ]
      }
    }
    ```

#### `GET /api/v1/posts/:blogSlug/:postSlug`
*   **Description**: Retrieve full details of a single post.
*   **Authentication**: Optional (Blog owners can read their drafts; public readers can only read published posts).
*   **Success Response (200 OK)**: Increments view count.
    ```json
    {
      "success": true,
      "data": {
        "id": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1",
        "title": "Introduction to Sequelize",
        "slug": "introduction-to-sequelize",
        "contentHtml": "<p>Sequelize is a promise-based Node.js ORM...</p>",
        "tags": ["sequelize", "postgres"],
        "status": "published",
        "viewCount": 1,
        "likesCount": 0,
        "hasLiked": false,
        "publishedAt": "2026-07-15T12:05:00.000Z"
      }
    }
    ```
*   **Error Responses**:
    *   `404 Not Found`: `{"success": false, "message": "Post not found"}`

#### `PATCH /api/v1/posts/:blogSlug/:postSlug`
*   **Description**: Update post details.
*   **Authentication**: Yes (Must own the blog).
*   **Request Body**: Any combination of `title`, `contentHtml`, `excerpt`, `coverImageUrl`, `tags`.
*   **Success Response (200 OK)**: Returns updated Post object JSON.

#### `DELETE /api/v1/posts/:blogSlug/:postSlug`
*   **Description**: Soft-delete a post.
*   **Authentication**: Yes (Must own the blog).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Post deleted successfully"
    }
    ```

#### `PATCH /api/v1/posts/:blogSlug/:postSlug/publish`
*   **Description**: Publish a draft post.
*   **Authentication**: Yes (Must own the blog).
*   **Success Response (200 OK)**: Returns updated Post object with status `"published"`.

#### `PATCH /api/v1/posts/:blogSlug/:postSlug/unpublish`
*   **Description**: Revert a published post to draft.
*   **Authentication**: Yes (Must own the blog).
*   **Success Response (200 OK)**: Returns updated Post object with status `"draft"`.

---

### Comment Management Module

#### `GET /api/v1/comments/:postId`
*   **Description**: List comments for a post.
*   **Authentication**: None.
*   **Query Parameters**:
    *   `page` (Integer, Optional): Default `1`.
    *   `limit` (Integer, Optional): Default `20`, max `100`.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 },
        "comments": [
          {
            "id": "e30678d4-539c-48d6-a212-d85c889f81a1",
            "body": "Really clean walkthrough!",
            "isEdited": false,
            "createdAt": "2026-07-15T12:10:00.000Z",
            "updatedAt": "2026-07-15T12:10:00.000Z",
            "author": { "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62", "username": "dev_creator" }
          }
        ]
      }
    }
    ```

#### `POST /api/v1/comments/:postId`
*   **Description**: Add a comment to a published post.
*   **Authentication**: Yes.
*   **Request Body**:
    *   `body` (String, Required): 1-2000 characters.
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Comment added successfully",
      "data": {
        "id": "e30678d4-539c-48d6-a212-d85c889f81a1",
        "body": "Really clean walkthrough!",
        "isEdited": false
      }
    }
    ```
*   **Error Responses**:
    *   `403 Forbidden`: `{"success": false, "message": "Cannot comment on an unpublished post"}`

#### `PATCH /api/v1/comments/:commentId`
*   **Description**: Edit a comment.
*   **Authentication**: Yes (Must be the author of the comment).
*   **Request Body**:
    *   `body` (String, Required): 1-2000 characters.
*   **Success Response (200 OK)**: Returns updated Comment JSON with `isEdited: true`.

#### `DELETE /api/v1/comments/:commentId`
*   **Description**: Delete a comment.
*   **Authentication**: Yes (Must be the author of the comment).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Comment deleted successfully"
    }
    ```

---

### Engagement / Like Module

#### `GET /api/v1/posts/:blogSlug/:postSlug/likes`
*   **Description**: Get like metadata.
*   **Authentication**: Optional.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "postId": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1",
        "likeCount": 1,
        "hasLiked": true
      }
    }
    ```

#### `GET /api/v1/posts/:blogSlug/:postSlug/likes/users`
*   **Description**: Get users who liked a post.
*   **Authentication**: None.
*   **Query Parameters**: `page`, `limit`.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "postId": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1",
        "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 },
        "likers": [
          { "id": "user-uuid", "username": "reader_one", "likedAt": "2026-07-15T12:00:00.000Z" }
        ]
      }
    }
    ```

#### `POST /api/v1/posts/:blogSlug/:postSlug/like`
*   **Description**: Like a post.
*   **Authentication**: Yes.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Post liked successfully",
      "data": { "postId": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1", "likeCount": 1, "hasLiked": true }
    }
    ```

#### `DELETE /api/v1/posts/:blogSlug/:postSlug/like`
*   **Description**: Unlike a post.
*   **Authentication**: Yes.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Post unliked successfully",
      "data": { "postId": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1", "likeCount": 0, "hasLiked": false }
    }
    ```

---

### Media Management Module

#### `POST /api/v1/media`
*   **Description**: Upload image file.
*   **Authentication**: Yes.
*   **Request Header**: `Content-Type: multipart/form-data`
*   **Request Body**: `file` (File, Required): Image file (jpeg, png, webp, gif), max 5MB.
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Image uploaded successfully",
      "data": {
        "id": "5f6b2169-7871-46ab-8239-2e90c8a14b98",
        "url": "https://res.cloudinary.com/blogsphere/image/upload/...",
        "fileName": "diagram.png",
        "fileSize": 345000,
        "mimeType": "image/png",
        "createdAt": "2026-07-15T12:15:00.000Z"
      }
    }
    ```

#### `GET /api/v1/media`
*   **Description**: List user's uploaded images.
*   **Authentication**: Yes.
*   **Query Parameters**: `page` (default 1), `limit` (default 20).
*   **Success Response (200 OK)**: Returns paginated list of media objects.

#### `DELETE /api/v1/media/:id`
*   **Description**: Delete an uploaded image.
*   **Authentication**: Yes (Must own the media record).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Media deleted successfully"
    }
    ```

---

### Search & Discovery Module

#### `GET /api/v1/search`
*   **Description**: Public endpoint to search published posts by keyword, optionally filter by blog slug, sort by latest or popularity, and paginate results.
*   **Authentication**: None.
*   **Query Parameters**:
    *   `q` or `query` (String, Optional): Search keyword matched against title, excerpt, and contentHtml.
    *   `blogSlug` (String, Optional): Filters posts to a specific blog.
    *   `sortBy` (String, Optional): Sorting order (`"latest"` or `"popular"`). Defaults to `"latest"`.
    *   `page` (Integer, Optional): Pagination page number. Defaults to `1`.
    *   `limit` (Integer, Optional): Pagination size limit. Defaults to `10`, max `50`.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "pagination": {
          "total": 1,
          "page": 1,
          "limit": 10,
          "totalPages": 1
        },
        "posts": [
          {
            "id": "c1a938c4-be31-4171-8bc8-c6499e1ef6a1",
            "title": "Understanding Express Middleware",
            "slug": "understanding-express-middleware",
            "excerpt": "A post about middleware",
            "coverImageUrl": null,
            "tags": ["express", "nodejs"],
            "status": "published",
            "viewCount": 5,
            "publishedAt": "2026-07-15T12:05:00.000Z",
            "createdAt": "2026-07-15T12:00:00.000Z",
            "author": {
              "id": "2e7a0279-d2b4-4b5b-a79b-2e90c8a14b62",
              "username": "dev_creator",
              "fullName": "Dev Creator",
              "avatarUrl": null
            }
          }
        ]
      }
    }
    ```
*   **Error Responses**:
    *   `500 Internal Server Error`: `{"success": false, "message": "Internal Server Error"}`

---

## 6. Database Schema

The database schemas are defined using **Sequelize Models** mapped to PostgreSQL tables:

### 1. User Model (`User.js`)
*   **Table Name**: `users`
*   **Columns**:
    *   `id` (UUID, PK): Default UUIDV4.
    *   `username` (VARCHAR(50), Unique, Not Null)
    *   `email` (VARCHAR(255), Unique, Not Null)
    *   `password` (VARCHAR, Not Null)
    *   `fullName` (VARCHAR(100), Nullable)
    *   `bio` (TEXT, Nullable)
    *   `avatarUrl` (VARCHAR(500), Nullable)
    *   `websiteUrl` (VARCHAR(500), Nullable)
    *   `status` (ENUM("active", "inactive", "suspended", "banned"), Default: "active")
    *   `isEmailVerified` (BOOLEAN, Default: false)
    *   `passwordResetToken` (VARCHAR, Nullable)
    *   `passwordResetExpiresAt` (DATE, Nullable)
    *   `lastLoginAt` (DATE, Nullable)
    *   `preferences` (JSONB, Default: `{ theme: "system", language: "en", emailNotifications: true }`)
    *   `deletedAt` (DATE, Nullable): Paranoid soft-delete.

### 2. Blog Model (`Blog.js`)
*   **Table Name**: `blogs`
*   **Columns**:
    *   `id` (UUID, PK): Default UUIDV4.
    *   `ownerId` (UUID, Not Null): References `users(id)`. **This links the Blog tenant to a User.**
    *   `name` (VARCHAR(100), Not Null)
    *   `slug` (VARCHAR(100), Unique, Not Null)
    *   `description` (TEXT, Nullable)
    *   `logoUrl` (VARCHAR(500), Nullable)
    *   `bannerUrl` (VARCHAR(500), Nullable)
    *   `settings` (JSONB, Default: `{ theme: "default", isCommentsEnabled: true, isPublic: true }`)
    *   `isActive` (BOOLEAN, Default: true)
    *   `deletedAt` (DATE, Nullable): Paranoid soft-delete.

### 3. Post Model (`Post.js`)
*   **Table Name**: `posts`
*   **Columns**:
    *   `id` (UUID, PK): Default UUIDV4.
    *   `blogId` (UUID, Not Null): References `blogs(id)`. **This acts as the primary tenant identifier column (`blog_id`) for posts.**
    *   `authorId` (UUID, Not Null): References `users(id)`.
    *   `title` (VARCHAR(200), Not Null)
    *   `slug` (VARCHAR(220), Not Null): Unique scope `[blog_id, slug]`.
    *   `contentHtml` (TEXT, Nullable)
    *   `excerpt` (VARCHAR(500), Nullable)
    *   `coverImageUrl` (VARCHAR(500), Nullable)
    *   `tags` (ARRAY(VARCHAR), Default: `[]`)
    *   `status` (ENUM("draft", "published", "archived"), Default: "draft")
    *   `publishedAt` (DATE, Nullable)
    *   `viewCount` (INTEGER, Default: 0)
    *   `deletedAt` (DATE, Nullable): Paranoid soft-delete.

### 4. Comment Model (`Comment.js`)
*   **Table Name**: `comments`
*   **Columns**:
    *   `id` (UUID, PK): Default UUIDV4.
    *   `postId` (UUID, Not Null): References `posts(id)`. **Tenant isolation is transitively enforced via the Post's `blogId`.**
    *   `authorId` (UUID, Not Null): References `users(id)`.
    *   `body` (TEXT, Not Null)
    *   `isEdited` (BOOLEAN, Default: false)
    *   `deletedAt` (DATE, Nullable): Paranoid soft-delete.

### 5. Like Model (`Like.js`)
*   **Table Name**: `likes`
*   **Columns**:
    *   `id` (UUID, PK): Default UUIDV4.
    *   `postId` (UUID, Not Null): References `posts(id)`.
    *   `userId` (UUID, Not Null): References `users(id)`.
    *   *Note*: Has a unique index on `[post_id, user_id]`.

### 6. Media Model (`Media.js`)
*   **Table Name**: `media`
*   **Columns**:
    *   `id` (UUID, PK): Default UUIDV4.
    *   `userId` (UUID, Not Null): References `users(id)`.
    *   `url` (VARCHAR(1000), Not Null)
    *   `publicId` (VARCHAR(255), Not Null): Cloudinary ID.
    *   `fileName` (VARCHAR(255), Not Null)
    *   `fileSize` (INTEGER, Not Null)
    *   `mimeType` (VARCHAR(100), Not Null)

---

## 7. Error Handling

### Global Error Format
The API handles and standardizes all operational and unexpected errors, outputting a consistent JSON structure:

```json
{
  "success": false,
  "message": "Error details go here"
}
```
*   During development (`NODE_ENV=development` or `NODE_ENV=local`), a `stack` field containing the file stack trace is appended.

### Standard Response Codes
*   `400 Bad Request`: Validation failures, missing parameters, invalid inputs.
*   `401 Unauthorized`: Missing, expired, or invalid authorization tokens.
*   `403 Forbidden`: Authenticated requests attempting to modify resources they do not own (e.g. cross-tenant post modification).
*   `404 Not Found`: Resources (e.g. user, blog, post, comment) not found in the DB.
*   `409 Conflict`: Attempting to create resources with unique keys that are already taken (e.g. email, username, blog slug).
*   `500 Internal Server Error`: Uncaught exceptions, DB connection failures, storage provider issues.

---

## 8. Environment Variables

Below is the list of environment variables required to run the service:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `PORT` | Local server port configuration | `3000` |
| `NODE_ENV` | Running environment mode | `local` / `development` / `production` |
| `FRONTEND_DEV_URL` | Trusted CORS origin in development | `http://localhost:5173` |
| `FRONTEND_PROD_URL` | Trusted CORS origin in production | `https://blogsphere.com` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `random_long_string_hash` |
| `JWT_EXPIRY` | Token lifespan | `1d` (1 day) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/database` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name for image hosting | `my_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key credential | `1234567890` |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret credential | `secret_hash_key` |
