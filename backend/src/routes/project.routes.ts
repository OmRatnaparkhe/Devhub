import { requireAuth, type SessionAuthObject } from "@clerk/express";
import { Router, type Request, type Response } from "express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";

const router = Router();
const ProjectRouter = router;

//For creating project
router.post("/create",upload.single("thumbnail"),requireAuth(),async(req:Request,res:Response)=>{
    try{
        const {title, description,githubUrl,liveUrl,technologies} = req.body;
        console.log("started")
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;

        if(!githubUrl || !description || !title || !technologies){
            res.json({message:"Your project doesn't have title, technologies, description and githubUrl"});
            return;
        }

        let thumbnailUrl = "";
        if(req.file){
            thumbnailUrl = await uploadFileToCloudinary(req.file,"projects-thumbnails",{
                width:300,
                height:300
            });
        }
        console.log("mid")
        const project = await prisma.project.create({
            data:{
                title,
                description,
                githubUrl,
                thumbnail:thumbnailUrl,
                liveUrl,
                userId,
                technologies:{
                    connectOrCreate:technologies.map((tech:string)=>({
                         where: { name: tech },   // must match a unique field
        create: { name: tech }, 
                    }))
                }
            }
        });

        console.log("end")
        res.json(project)
    }
    catch(err){
        console.error("Error while creating project : ",err);
        res.status(500).json({error:"Something went wrong!!",err})
    }
});


//For fetching all projects by user
router.get("/user/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const userId = req.params.id;
        if(!userId){
            res.json({message:"UserId not found"})
            return;
        }
        const projects = await prisma.project.findMany({
            where:{
                userId
            },
            include:{
                technologies:true,
                user: {
                    select: {
                        name: true,
                        username: true,
                        profilePic: true,
                    }
                }
            },
            orderBy:{
                date:"desc"
            }
        })
        res.json(projects)
    }
    catch(err){
        console.error({error:"Error while fetching projects"});
        res.status(500).json({message:"Something went wrong!!"})
    }
});

//For fetching single project by projectId
router.get("/:id", requireAuth(), async (req: Request, res: Response) => {
    try {
        const projectId = req.params.id;

        const project = await prisma.project.findUnique({
            where: {
                id: projectId
            },
            // MODIFIED: Added comments to the include object
            include: {
                technologies: true,
                user: true,
                comments: { // ADD this to fetch comments
                    include: {
                        author: true // Also fetch the user for each comment
                    }
                }
            }
        });

        // ADD THIS CHECK: If the project is not found, send a 404 error.
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // This will now only run if the project was found successfully
        res.json(project);

    } catch (err) {
        console.error("Error while fetching project by ID:", err); // Improved error message
        res.status(500).json({ error: "Something went wrong!!" });
    }
});


//For updating project
router.put("/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const projectId = req.params.id;
        const userId = auth.userId;
        const {title, description, thumbnail,githubUrl,liveUrl, technologies} = req.body;

        const project = await prisma.project.findUnique({
            where:{
                id:projectId
            }
        });
        if(!project){
            res.json({error:"Project is not present"})
            return;
        }

        if(project.userId!==userId){
            res.json({error:"You are not authorized to edit this project!!"});
            return;
        }

        const updated = await prisma.project.update({
            where:{
                id:projectId
            },
            data:{
                title,
                thumbnail,
                githubUrl,
                liveUrl,
                description,
                technologies:{
                    connect:technologies.map((tech:string)=>({name:tech}))
                }
            },
        });
        res.json({message:"Project updated successfully!!"})
    }
    catch(err){
        console.error("Error while updating the project : ",err);
        res.status(500).json({error:"Something went wrong!!"});
    }
});

//For adding comments to a project
router.post("/:projectId/comment", requireAuth(), async (req: Request, res: Response) => {
    try {
        // 1. Extract all necessary IDs and data
        const { projectId } = req.params;
        const { content } = req.body;
         if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ message: "User not authenticated." });
    }
        const  {userId}  = req.auth; // Get the authenticated user's ID from the middleware

        // 2. Validate the input
        if (!content || typeof content !== 'string' || content.trim() === "") {
            return res.status(400).json({ message: "Comment content cannot be empty." });
        }
        if (!userId) {
            return res.status(401).json({ message: "Authentication error: User ID not found." });
        }

        // 3. Create a new Comment record in the database, linking it to the project and author
        const newComment = await prisma.comment.create({
            data: {
                content: content,
                projectId: projectId, // Link to the project
                authorId: userId ,
                postId: null    // Link to the user (author)
            },
            include: {
                // Include the author's details in the response
                // This is useful for the frontend to immediately display the new comment with the user's name and picture
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        profilePic: true
                    }
                }
            }
        });

        // 4. Send a success response
        res.status(201).json(newComment);

    } catch (error) {
        // 5. Handle potential errors, such as a non-existent projectId
        console.error("Failed to add comment:", error);
        res.status(500).json({ message: "Something went wrong while adding the comment." });
    }
});

//For fetching all comments of a particular project
router.get("/:projectId/getComments", requireAuth(), async (req: Request, res: Response) => {
    try {
        // This check is good, but let's send a proper status code.
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { projectId } = req.params;
        
        // This check is mostly redundant if your routing is correct, but it's okay to have.
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        // Renamed variable for clarity
        const comments = await prisma.comment.findMany({
            where: {
                projectId: projectId
            },
            include: {
                // Be specific about what author data you need
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        profilePic: true,
                    }
                }
            },
            orderBy: {
                // It's good practice to order the comments
                createdAt: 'asc' // or 'desc' for newest first
            }
        });

        // ✅ This is the crucial missing part: send the comments back to the client.
        res.status(200).json(comments);

    } catch (err) {
        console.error("Failed to fetch comments:", err);
        // Send a proper error response
        res.status(500).json({ message: "Something went wrong while fetching comments." });
    }
});
//For deleting comment on project
router.delete("/comment/:commentId", requireAuth(), async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ message: "User not authenticated." });
    }
        const { userId } = req.auth;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // First, find the comment to ensure it exists and to check the author
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }

        // Security Check: Ensure the person deleting the comment is its author
        if (comment.authorId !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only delete your own comments." });
        }

        // If all checks pass, delete the comment
        await prisma.comment.delete({
            where: { id: commentId },
        });

        res.status(200).json({ message: "Comment deleted successfully." });

    } catch (error) {
        console.error("Failed to delete comment:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
//For deleting a project
router.delete("/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;
        const projectId = req.params.id;

        const project = await prisma.project.findUnique({
            where:{
                id:projectId
            }
        })

        if(!project){
            res.json({message:"Project not found!!"});
            return;
        }
        if(project.userId!==userId){
            res.json({error:"You are not authorized to delete this project!!"})
            return;
        }

        await prisma.project.delete({
            where:{
                id:projectId
            },
        });
        res.json({message:"Project deleted successfully!"})
    }
    catch(err){
        console.error("Error while deleting project : ",err)
        res.status(500).json({error:"Something went wrong!!"})
    }
});

export default ProjectRouter;
