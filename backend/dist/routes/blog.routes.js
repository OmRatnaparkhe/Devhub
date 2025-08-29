"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@clerk/express");
const express_2 = require("express");
const server_1 = require("../server");
const uploadFile_1 = __importStar(require("../middleware/uploadFile"));
const router = (0, express_2.Router)();
const BlogsRouter = router;
//For creating a blog
router.post("/create", express_1.requireAuth, uploadFile_1.default.single("blog"), async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        const { title, description, content, technologies } = req.body;
        if (!title || !description || !content || !technologies) {
            res.json({ error: "You haven't provided title, description, content and technologies!!" });
            return;
        }
        let blogUrl = "";
        if (req.file) {
            blogUrl = await (0, uploadFile_1.uploadFileToCloudinary)(req.file, "blog-thumbnail", {
                width: 300,
                height: 300
            });
        }
        const blog = await server_1.prisma.blog.create({
            data: {
                title,
                description,
                content,
                blogThumbnail: blogUrl,
                userId,
                technologies: {
                    connect: technologies.map((tech) => { name: tech; })
                }
            }
        });
        res.json(blog);
        res.json({ message: "Blog created successfully!" });
    }
    catch (err) {
        console.error("Error while creating blog : ", err);
        res.status(500).json("Something went wrong!!");
    }
});
//For fetching all blogs by certain user
router.get("/user/:id", express_1.requireAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            res.json({ error: "User is not authorized!!" });
            return;
        }
        const blogs = await server_1.prisma.blog.findMany({
            where: {
                id: userId
            },
            include: {
                technologies: true,
            },
            orderBy: {
                publishedAt: "desc" // Or updatedAt:"desc" depending on desired sort
            },
        });
        res.json(blogs);
    }
    catch (err) {
        console.error("Error while fetching blogs : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For fetching particular blog by user
router.get("/:id", express_1.requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        if (!blogId) {
            res.json({ error: "Blog is not present!!" });
            return;
        }
        const blog = await server_1.prisma.blog.findUnique({
            where: {
                id: blogId
            },
            include: {
                technologies: true,
                user: true
            }
        });
        res.json(blog);
    }
    catch (err) {
        console.error("Error while fetching blog : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For updating blog
router.put("/:id", express_1.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        const blogId = req.params.id;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        const { title, description, content, technologies } = req.body;
        const blog = await server_1.prisma.blog.findUnique({
            where: {
                id: blogId
            }
        });
        if (!blog) {
            res.json({ error: "Blog is not present" });
            return;
        }
        if (blog.userId !== userId) {
            res.json({ error: "You are not authorized to edit this blog!!" });
            return;
        }
        const updated = await server_1.prisma.blog.update({
            where: {
                id: blogId
            },
            data: {
                title,
                content,
                description,
                technologies: {
                    connect: technologies.map((tech) => { name: tech; })
                }
            },
        });
        res.json({ message: "Blog updated successfully!!" });
        res.json(updated);
    }
    catch (err) {
        console.error("Error while updating the blog : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For deleting a blog
router.delete("/:id", express_1.requireAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        const blog = await server_1.prisma.blog.findUnique({
            where: {
                id: blogId
            },
            include: {
                user: true,
            }
        });
        if (!blog) {
            res.status(404).json({ error: "Blog not found!!" });
            return;
        }
        if (blog.userId !== userId) {
            res.status(403).json({ error: "User is not authorized to delete this blog!!" });
            return;
        }
        await server_1.prisma.blog.delete({
            where: {
                id: blogId
            }
        });
        res.json({ message: "Blog deleted successfully!!" });
    }
    catch (err) {
        console.error("Error while deleting blog : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
exports.default = BlogsRouter;
