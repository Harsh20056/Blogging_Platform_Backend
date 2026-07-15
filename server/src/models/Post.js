import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Post = sequelize.define(
  "Post",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    blogId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { len: [3, 200] },
    },

    // Story #22 — auto-generated, blog-scoped (blog_id + slug = unique)
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },

    // Rich HTML content (sanitized before save in service layer)
    contentHtml: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Short plain-text summary shown in listings
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    coverImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // Comma-separated or JSONB array of tags
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },



    // "draft"     → Story #21 (Save as Draft)
    // "published" → Story #20 (Publish)
    // "archived"  → soft-removed from listings but not deleted
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      defaultValue: "draft",
    },

    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    paranoid: true,        // soft delete
    underscored: true,
    tableName: "posts",

    indexes: [
      // Story #22 — slug must be unique within a blog, not globally
      { unique: true, fields: ["blog_id", "slug"] },
      { fields: ["author_id"] },
      { fields: ["status"] },
      { fields: ["published_at"] },
    ],
  }
);

export default Post;
