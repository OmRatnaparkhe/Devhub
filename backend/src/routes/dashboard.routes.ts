import { requireAuth } from "@clerk/express";

import express, { Router } from "express"
import { prisma } from "../server";
const router = Router()

router.get("/feed", requireAuth(), async (req, res) => {
    try {
        const currentUserId = req.auth?.userId;
        if (!currentUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 1. Find the IDs of users the current user is following
        const following = await prisma.follows.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
        });

        const followingIds = following.map((f) => f.followingId);

        // 2. Fetch projects from those followed users
        const feedProjects = await prisma.project.findMany({
            where: {
                userId: {
                    in: followingIds,
                },
            },
            include: {
                user: { // Include author details
                    select: {
                        name: true,
                        username: true,
                        profilePic: true,
                    },
                },
                technologies: true, // Include project technologies
            },
            orderBy: {
                date: "desc", // Show the newest projects first
            },
            take: 50, // Limit the number of projects in the feed
        });

        res.json(feedProjects);
    } catch (err) {
        console.error("Error fetching dashboard feed:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;