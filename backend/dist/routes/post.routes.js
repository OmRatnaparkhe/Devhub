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
const express_1 = require("express");
const express_2 = require("@clerk/express");
const server_1 = require("../server");
const uploadFile_1 = __importStar(require("../middleware/uploadFile"));
const router = (0, express_1.Router)();
router.use((0, express_2.requireAuth)());
const postRoutes = router;
//For creating a post
router.post("/", express_2.requireAuth, uploadFile_1.default.single("image"), async (req, res) => {
    try {
        const { content } = req.body;
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const authorId = auth.userId;
        if (!content.trim()) {
            res.status(400).json("Post content is required!!");
            return;
        }
        let imageUrl = "";
        if (req.file) {
            imageUrl = await (0, uploadFile_1.uploadFileToCloudinary)(req.file, "Post-image", {
                width: 300,
                height: 300
            });
        }
        const post = await server_1.prisma.post.create({
            data: {
                content,
                imageUrl: imageUrl,
                authorId
            },
        });
        res.json(post);
    }
    catch (err) {
        console.error("Error creating post : ", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
//For fetching posts
router.get("/feed", express_2.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "5", 10);
        const posts = await server_1.prisma.post.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    { author: { followers: { some: { followerId: userId } } } }
                ],
            },
            include: {
                author: true,
                likes: true,
                comments: {
                    include: { author: true }
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit
        });
        res.json({
            posts,
            nextPage: posts.length === limit ? page + 1 : null
        });
    }
    catch (err) {
        console.error("Error fetching posts : ", err);
        res.status(500).json({
            error: "Something went wrong!!"
        });
    }
});
//For liking/disliking post
router.post("/:id/like", express_2.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        const postId = req.params.id;
        const existing = await server_1.prisma.like.findFirst({
            where: { postId, userId }
        });
        if (existing) {
            await server_1.prisma.like.delete({
                where: {
                    id: existing.id
                }
            });
            res.json({
                like: false
            });
            return;
        }
        else {
            await server_1.prisma.like.create({
                data: {
                    userId, postId
                }
            });
            res.json({ like: true });
            return;
        }
    }
    catch (err) {
        console.error("Error while liking : ", err);
        res.status(500).json({ message: "Something went wrong!!" });
    }
});
// For commenting on posts
router.post("/:id/comment", express_2.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const authorId = auth.userId;
        const postId = req.params.id;
        const { content } = req.body;
        if (!content?.trim()) {
            res.status(400).json({ message: "Comment cannot be empty!!" });
        }
        const comment = await server_1.prisma.comment.create({
            data: {
                content,
                postId,
                authorId
            },
            include: { author: true }
        });
        res.json(comment);
    }
    catch (err) {
        console.error("Error adding comment : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
exports.default = postRoutes;
