"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const post_routes_1 = __importDefault(require("./post.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const project_routes_1 = __importDefault(require("./project.routes"));
const blog_routes_1 = __importDefault(require("./blog.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, express_2.clerkMiddleware)());
app.use("/api/projects", project_routes_1.default);
app.use("/api/blogs", blog_routes_1.default);
app.use("/api/posts", post_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.listen(3000, () => console.log("Server is running on Port : 3000"));
