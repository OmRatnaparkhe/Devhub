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
const ProjectRouter = router;
//For creating project
router.post("/create", express_1.requireAuth, uploadFile_1.default.single("thumbnail"), async (req, res) => {
    try {
        const { title, description, githubUrl, liveUrl, technologies } = req.body;
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        if (!githubUrl || !description || !title || !technologies) {
            res.json({ message: "Your project doesn't have title, technologies, description and githubUrl" });
            return;
        }
        let thumbnailUrl = "";
        if (req.file) {
            thumbnailUrl = await (0, uploadFile_1.uploadFileToCloudinary)(req.file, "projects-thumbnails", {
                width: 300,
                height: 300
            });
        }
        const project = await server_1.prisma.project.create({
            data: {
                title,
                description,
                githubUrl,
                thumbnail: thumbnailUrl,
                liveUrl,
                userId,
                technologies: {
                    connect: technologies.map((tech) => ({ name: tech }))
                }
            }
        });
        res.json(project);
    }
    catch (err) {
        console.error("Error while creating project : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For fetching all projects by user
router.get("/user/:id", express_1.requireAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            res.json({ message: "UserId not found" });
            return;
        }
        const projects = await server_1.prisma.project.findMany({
            where: {
                userId
            },
            include: {
                technologies: true
            },
            orderBy: {
                date: "desc"
            }
        });
        res.json(projects);
    }
    catch (err) {
        console.error({ error: "Error while fetching projects" });
        res.status(500).json({ message: "Something went wrong!!" });
    }
});
//For fetching single project by projectId
router.get("/:id", express_1.requireAuth, async (req, res) => {
    try {
        const projectId = req.params.id;
        if (!projectId) {
            res.json({ message: "UserId is not present!!" });
        }
        const project = await server_1.prisma.project.findUnique({
            where: {
                id: projectId
            },
            include: {
                technologies: true,
                user: true
            }
        });
        res.json(project);
    }
    catch (err) {
        console.error("Error while fetching project!!");
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For updating project
router.put("/:id", express_1.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const projectId = req.params.id;
        const userId = auth.userId;
        const { title, description, thumbnail, githubUrl, liveUrl, technologies } = req.body;
        const project = await server_1.prisma.project.findUnique({
            where: {
                id: projectId
            }
        });
        if (!project) {
            res.json({ error: "Project is not present" });
            return;
        }
        if (project.userId !== userId) {
            res.json({ error: "You are not authorized to edit this project!!" });
            return;
        }
        const updated = await server_1.prisma.project.update({
            where: {
                id: projectId
            },
            data: {
                title,
                thumbnail,
                githubUrl,
                liveUrl,
                description,
                technologies: {
                    connect: technologies.map((tech) => ({ name: tech }))
                }
            },
        });
        res.json({ message: "Project updated successfully!!" });
    }
    catch (err) {
        console.error("Error while updating the project : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
//For deleting a project
router.delete("/:id", express_1.requireAuth, async (req, res) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const userId = auth.userId;
        const projectId = req.params.id;
        const project = await server_1.prisma.project.findUnique({
            where: {
                id: projectId
            }
        });
        if (!project) {
            res.json({ message: "Project not found!!" });
            return;
        }
        if (project.userId !== userId) {
            res.json({ error: "You are not authorized to delete this project!!" });
            return;
        }
        await server_1.prisma.project.delete({
            where: {
                id: projectId
            },
        });
        res.json({ message: "Project deleted successfully!" });
    }
    catch (err) {
        console.error("Error while deleting project : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});
exports.default = ProjectRouter;
