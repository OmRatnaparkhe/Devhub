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
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const router = (0, express_2.Router)();
const userRoutes = router;
router.get("/search", express_1.requireAuth, async (req, res) => {
    try {
        const query = req.query.query || "";
        if (!query?.trim()) {
            res.json([]);
            return;
        }
        const users = await server_1.prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { username: { contains: query, mode: "insensitive" } }
                ],
            },
            take: 10
        });
        res.json(users);
    }
    catch (err) {
        console.error("Error while searching : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For onboarding profile updation
router.post("/profile", express_1.requireAuth, uploadFile_1.default.fields([{ name: "profilePic", maxCount: 1 }]), async (req, res) => {
    console.log("👉 Profile route entered");
    try {
        const auth = req.auth;
        console.log("👉 Clerk auth:", auth);
        if (!auth?.userId) {
            console.log("❌ No userId");
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = auth.userId;
        console.log("👉 req.body:", req.body);
        console.log("👉 req.files:", req.files);
        // ✅ Get Clerk user data
        const clerkUser = await clerk_sdk_node_1.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const clerkName = clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || "";
        const { name, username, description, githubLink, role } = req.body;
        // ✅ Prepare update data (use null instead of undefined)
        let profilePicUrl = null;
        const files = req.files;
        if (files?.profilePic && files.profilePic[0]) {
            try {
                profilePicUrl = await (0, uploadFile_1.uploadFileToCloudinary)(files.profilePic[0], "profile-image", { width: 300, height: 300 });
            }
            catch (uploadError) {
                console.error("Error uploading profile picture to Cloudinary:", uploadError);
                return res
                    .status(500)
                    .json({ error: "Failed to upload profile picture." });
            }
        }
        console.log("👉 Running prisma.upsert");
        const user = await server_1.prisma.user.upsert({
            where: { id: userId },
            update: {
                name: name || clerkName || "",
                username: username || clerkUser.username,
                email,
                description: description ? { set: description } : undefined,
                githubLink: githubLink ? { set: githubLink } : undefined,
                role: role || "",
                onboarded: true,
                profilePic: profilePicUrl ? { set: profilePicUrl } : undefined,
            },
            create: {
                id: userId,
                name: name || clerkName || "",
                username: username || clerkUser.username,
                email,
                description: description || null,
                githubLink: githubLink || null,
                role: role || "",
                onboarded: true,
                profilePic: profilePicUrl,
            },
        });
        res.json(user);
    }
    catch (err) {
        console.error("❌ Error updating/creating user profile:", err);
        return res.status(500).json({
            error: "Something went wrong during profile setup.",
        });
    }
});
//Get profile with posts, projects, blogs
router.get("/:id/profile", express_1.requireAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await server_1.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                posts: { orderBy: { createdAt: "desc" } },
                projects: true,
                blogs: true
            }
        });
        if (!user) {
            res.status(404).json({ error: "User not found!!" });
            return;
        }
        res.json(user);
    }
    catch (err) {
        console.error("Error while fetching user : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
    ;
});
router.post("/:id/follow", express_1.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const currentUserId = auth.userId;
        const targettedUserId = req.params.id;
        if (currentUserId === targettedUserId) {
            console.error("Cannot follow yourself!!");
        }
        const existing = await server_1.prisma.follows.findFirst({
            where: {
                followerId: currentUserId,
                followingId: targettedUserId
            }
        });
        if (existing) {
            await server_1.prisma.follows.delete({
                where: {
                    id: existing.id
                }
            });
            res.json({ following: false });
        }
        else {
            await server_1.prisma.follows.create({
                data: {
                    followerId: currentUserId,
                    followingId: targettedUserId
                }
            });
            res.json({ following: true });
            return;
        }
    }
    catch (err) {
        console.error("Error while following!!");
        res.status(500).json({
            message: "Something went wrong!!"
        });
    }
});
exports.default = userRoutes;
