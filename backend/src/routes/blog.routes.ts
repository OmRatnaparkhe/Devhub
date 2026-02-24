import { requireAuth, type SessionAuthObject } from "@clerk/express";
import { Router, type Request, type Response } from "express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";

const router = Router();

const BlogsRouter = router;

//For creating a blog

router.post("/create",requireAuth(),upload.single("blog"),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;
        const {title,description,content,technologies} = req.body;

        if(!title||!description||!content||!technologies){
            res.json({error:"You haven't provided title, description, content and technologies!!"})
            return;
        }
        let blogUrl = "";
        if(req.file){
            blogUrl = await uploadFileToCloudinary(req.file,"blog-thumbnail",{
                width:300,
                height:300
            })
        }
        const blog = await prisma.blog.create({
            data:{
                title,
                description,
                content,
                blogThumbnail:blogUrl,
                userId,
                technologies:{
                    connect:technologies.map((tech:string)=>{name:tech})
                }
            }
        });
        res.json(blog);
        res.json({message:"Blog created successfully!"})
    }
    catch(err){
        console.error("Error while creating blog : ",err);
        res.status(500).json("Something went wrong!!")
    }
});

//For fetching all blogs by certain user
router.get("/user/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const userId = req.params.id as string;

        if(!userId){
            res.json({error:"User is not authorized!!"});
            return;
        }

        const blogs = await prisma.blog.findMany({
            where:{
                userId:userId
            },
            include:{
                technologies:true,
            },
            orderBy:{
                publishedAt:"desc" // Or updatedAt:"desc" depending on desired sort
            },
        });
        res.json(blogs);
    }
    catch(err){
        console.error("Error while fetching blogs : ",err);
        res.status(500).json({error:"Something went wrong!!"})
    }
});

//For fetching particular blog by user
router.get("/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const blogId = req.params.id as string;
        if(!blogId){
            res.json({error:"Blog is not present!!"});
            return;
        } 
        const blog = await prisma.blog.findUnique({
            where:{
                id:blogId as string
            },
            include:{
                technologies:true,
                user:true
            }
        });
        res.json(blog);
    }
    catch(err){
        console.error("Error while fetching blog : ",err);
        res.status(500).json({error:"Something went wrong!!"})
    }
});

//For updating blog
router.put("/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth ;
        const blogId = req.params.id as string;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;
        const {title, description, content, technologies} = req.body;

        const blog = await prisma.blog.findUnique({
            where:{
                id:blogId as string
            }
        });
        if(!blog){
            res.json({error:"Blog is not present"})
            return;
        }

        if(blog.userId!==userId){
            res.json({error:"You are not authorized to edit this blog!!"});
            return;
        }

        const updated = await prisma.blog.update({
            where:{
                id:blogId as string
            },
            data:{
                title,
                content,
                description,
                technologies:{
                    connect:technologies.map((tech:string)=>{name:tech})
                }
            },
        });
        res.json({message:"Blog updated successfully!!"})
        res.json(updated);
    }
    catch(err){
        console.error("Error while updating the blog : ",err);
        res.status(500).json({error:"Something went wrong!!"});
    }
});
//For deleting a blog
router.delete("/:id",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const blogId = req.params.id as string;
        const auth = req.auth ;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;

        const blog = await prisma.blog.findUnique({
            where:{
                id:blogId as string
            },
            include:{
                user:true,
            }
        });
        if(!blog){
            res.status(404).json({error:"Blog not found!!"})
            return;
        }
        if(blog.userId!==userId){
            res.status(403).json({error:"User is not authorized to delete this blog!!"})
            return;
        }

        await prisma.blog.delete({
            where:{
                id:blogId as string
            }
        });
        res.json({message:"Blog deleted successfully!!"})
    }
    catch(err){
        console.error("Error while deleting blog : ",err);
        res.status(500).json({error:"Something went wrong!!"});
    }
})
export default BlogsRouter;