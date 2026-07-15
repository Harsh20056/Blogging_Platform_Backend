import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Like = sequelize.define(
  "Like",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    postId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "likes",

    indexes: [
      // Enforce unique likes: a user can only like a post once
      { unique: true, fields: ["post_id", "user_id"] },
      { fields: ["post_id"] },
      { fields: ["user_id"] },
    ],
  }
);

export default Like;
