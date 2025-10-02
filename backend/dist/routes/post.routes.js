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
//For creating a post
router.post("/", (0, express_2.requireAuth)(), uploadFile_1.default.single("image"), async (req, res) => {
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
// Toggles a bookmark on a post
router.post("/:id/bookmark", (0, express_2.requireAuth)(), async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.auth?.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const existingBookmark = await server_1.prisma.bookmark.findUnique({
            where: { userId_postId: { userId, postId } },
        });
        if (existingBookmark) {
            // If it exists, delete it (un-bookmark)
            await server_1.prisma.bookmark.delete({
                where: { id: existingBookmark.id },
            });
            return res.json({ bookmarked: false });
        }
        else {
            // If it doesn't exist, create it (bookmark)
            await server_1.prisma.bookmark.create({
                data: { userId, postId },
            });
            return res.json({ bookmarked: true });
        }
    }
    catch (error) {
        console.error("Error toggling bookmark:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
// --- GET /api/posts/bookmarks ---
// Fetches all posts bookmarked by the current user
router.get("/bookmarks", (0, express_2.requireAuth)(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const bookmarks = await server_1.prisma.bookmark.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                // Include the full post data for each bookmark
                post: {
                    include: {
                        author: true,
                        likes: true,
                        comments: true,
                        bookmarks: { where: { userId } }, // Include bookmark status for the current user
                    },
                },
            },
        });
        // Map the result to return an array of posts, not bookmarks
        const bookmarkedPosts = bookmarks.map(b => b.post);
        res.json(bookmarkedPosts);
    }
    catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
//For fetching posts
router.get("/feed", (0, express_2.requireAuth)(), async (req, res) => {
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
                    { author: { following: { some: { followerId: userId } } } }
                ],
            },
            include: {
                author: true,
                likes: true,
                comments: {
                    include: { author: true }
                },
                bookmarks: {
                    where: { userId: userId ?? undefined }
                }
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
router.post("/:id/like", (0, express_2.requireAuth)(), async (req, res) => {
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
            try {
                const post = await server_1.prisma.post.findUnique({
                    where: {
                        id: postId
                    },
                    select: {
                        authorId: true
                    }
                });
                if (post && post.authorId !== userId) {
                    await server_1.prisma.notification.create({
                        data: {
                            type: "LIKE",
                            userId: post.authorId,
                            actorId: userId,
                            postId: postId
                        }
                    });
                }
            }
            catch (notificationError) {
                console.error("Failed to create like notification:", notificationError);
            }
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
router.post("/:id/comment", (0, express_2.requireAuth)(), async (req, res) => {
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
        try {
            const post = await server_1.prisma.post.findUnique({
                where: {
                    id: authorId
                },
                select: {
                    authorId: true
                }
            });
            if (post && post.authorId !== authorId) {
                await server_1.prisma.notification.create({
                    data: {
                        type: "COMMENT",
                        userId: post.authorId,
                        actorId: authorId,
                        postId: postId
                    }
                });
            }
        }
        catch (notificationError) {
            console.error("Failed to create comment notification:", notificationError);
        }
        res.json(comment);
    }
    catch (err) {
        console.error("Error adding comment : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
exports.default = router;
