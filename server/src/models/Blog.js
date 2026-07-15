import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Blog = sequelize.define(
  "Blog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/,
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bannerUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: "default",
        isCommentsEnabled: true,
        isPublic: true,
      },
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    paranoid: true,  
    underscored: true,
    tableName: "blogs",

    indexes: [
      { unique: true, fields: ["slug"] },
      { unique: true, fields: ["owner_id"] },
      { fields: ["is_active"] },
    ],
  }
);

export default Blog;