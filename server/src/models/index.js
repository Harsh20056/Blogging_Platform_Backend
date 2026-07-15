import sequelize  from "../config/db.js";
import User from "./User.js";
import Blog from "./Blog.js";
import Post from "./Post.js";
import Comment from "./Comment.js";
import Like from "./Like.js";
import Media from "./Media.js";

User.hasOne(Blog, { foreignKey: "ownerId", as: "blog" });
Blog.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

Blog.hasMany(Post, { foreignKey: "blogId", as: "posts" });
Post.belongsTo(Blog, { foreignKey: "blogId", as: "blog" });

User.hasMany(Post, { foreignKey: "authorId", as: "posts" });
Post.belongsTo(User, { foreignKey: "authorId", as: "author" });

Post.hasMany(Comment, { foreignKey: "postId", as: "comments" });
Comment.belongsTo(Post, { foreignKey: "postId", as: "post" });

User.hasMany(Comment, { foreignKey: "authorId", as: "comments" });
Comment.belongsTo(User, { foreignKey: "authorId", as: "author" });

User.belongsToMany(Post, { through: Like, foreignKey: "userId", as: "likedPosts" });
Post.belongsToMany(User, { through: Like, foreignKey: "postId", as: "likedByUsers" });

User.hasMany(Like, { foreignKey: "userId", as: "likes" });
Like.belongsTo(User, { foreignKey: "userId", as: "user" });

Post.hasMany(Like, { foreignKey: "postId", as: "likes" });
Like.belongsTo(Post, { foreignKey: "postId", as: "post" });

User.hasMany(Media, { foreignKey: "userId", as: "media" });
Media.belongsTo(User, { foreignKey: "userId", as: "user" });

// import Follow from "./Follow.js";

export {
    sequelize, User, Blog, Post, Comment, Like, Media,
}