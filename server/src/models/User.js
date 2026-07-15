import { DataTypes, DATE } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define("User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
                is: /^[a-zA-Z0-9_-]+$/,
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },

        fullName: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        avatarUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        websiteUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            validate: { isUrl: true },
        },
        status: {
            type: DataTypes.ENUM("active", "inactive", "suspended", "banned"),
            defaultValue: "active",
        },
        isEmailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        }, passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        passwordResetExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        preferences: {
            type: DataTypes.JSONB,
            defaultValue: {
                theme: "system",       // "light" | "dark" | "system"
                language: "en",
                emailNotifications: true,
            },
        },
    },
    {
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: "users",
        defaultScope: {
            // NEVER return password by default
            attributes: {
                exclude: [
                    "password",
                    "passwordResetToken",
                    "passwordResetExpiresAt",
                ],
            },
        },
        defaultScope: {
            // NEVER return password by default
            attributes: {
                exclude: [
                    "password",
                    "emailVerificationToken",
                    "passwordResetToken",
                    "passwordResetExpiresAt",
                ],
            },
        },
        scopes: {
            // Used ONLY for login — includes password hash
            withPassword: {
                attributes: {},
            },
            // Public-facing profile (for other users viewing your page)
            publicProfile: {
                attributes: [
                    "id",
                    "username",
                    "fullName",
                    "bio",
                    "avatarUrl",
                    "websiteUrl",
                    "createdAt",
                ],
            },
        },
        indexes: [
            { unique: true, fields: ["email"] },
            { unique: true, fields: ["username"] },
            { fields: ["status"] },
        ],
    }
)

export default User ; 