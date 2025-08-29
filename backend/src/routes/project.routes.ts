import { requireAuth, type SessionAuthObject } from "@clerk/express";
import { Router, type Request, type Response } from "express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";

const router = Router();
const ProjectRouter = router;

//For creating project
router.post("/create",requireAuth,upload.single("thumbnail"),async(req:Request,res:Response)=>{
    try{
        const {title, description,githubUrl,liveUrl,technologies} = req.body;
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
        const project = await prisma.project.create({
            data:{
                title,
                description,
                githubUrl,
                thumbnail:thumbnailUrl,
                liveUrl,
                userId,
                technologies:{
                    connect:technologies.map((tech:string)=>({name:tech}))
                }
            }
        });
        res.json(project)
    }
    catch(err){
        console.error("Error while creating project : ",err);
        res.status(500).json({error:"Something went wrong!!"})
    }
});


//For fetching all projects by user
router.get("/user/:id",requireAuth,async(req:Request,res:Response)=>{
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
                technologies:true
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
router.get("/:id",requireAuth,async(req:Request,res:Response)=>{
    try{
        const projectId = req.params.id;
        if(!projectId){
            res.json({message:"UserId is not present!!"});
        }
        const project = await prisma.project.findUnique({
            where:{
                id:projectId
            },
            include:{
                technologies:true,
                user:true
            }
        });
        res.json(project)
    }
    catch(err){
        console.error("Error while fetching project!!");
        res.status(500).json({error:"Something went wrong!!"});
    }
});


//For updating project
router.put("/:id",requireAuth,async(req:Request,res:Response)=>{
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
//For deleting a project
router.delete("/:id",requireAuth,async(req:Request,res:Response)=>{
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