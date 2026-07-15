import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Media = sequelize.define(
  "Media",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    publicId: {
      type: DataTypes.STRING(255),
      allowNull: false, // Cloudinary public_id for deletion
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "media",
    indexes: [
      { fields: ["user_id"] },
    ],
  }
);

export default Media;
