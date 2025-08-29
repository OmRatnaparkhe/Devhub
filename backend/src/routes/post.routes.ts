import { Router, type Request, type Response } from "express";
import { requireAuth } from "@clerk/express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";


const router = Router();
router.use(requireAuth())
const postRoutes = router
//For creating a post
router.post("/",requireAuth,upload.single("image"),async (req:Request,res:Response)=>{
    try{
    const {content} = req.body;
    const auth = req.auth ;
     if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
    const authorId = auth.userId;

    if(!content.trim()){
         res.status(400).json("Post content is required!!");
         return
    }
    let imageUrl = "";
    if(req.file){
        imageUrl = await uploadFileToCloudinary(req.file,"Post-image",{
            width:300,
            height:300
        })
    }
    const post = await prisma.post.create({
        data:{
            content,
            imageUrl:imageUrl,
            authorId
        },
    })
    res.json(post);
}catch(err){
    console.error("Error creating post : ",err);
    res.status(500).json({error:"Something went wrong"})
}
})

//For fetching posts
router.get("/feed",requireAuth,async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;

        const page = parseInt((req.query.page as string) || "1",10);
        const limit = parseInt((req.query.limit as string) || "5",10);

        const posts = await prisma.post.findMany({
            where:{
                OR:[
                    {authorId:userId},
                    {author:{followers : {some : {followerId : userId}}}}
                ],
            },
            include : {
                author:true,
                likes:true,
                comments:{
                    include: {author:true}
                },
            },
            orderBy : {createdAt:"desc"},
            skip:(page-1)*limit,
            take:limit
        })
        res.json({
            posts,
            nextPage:posts.length === limit ? page + 1:null
        })
    }catch(err){
        console.error("Error fetching posts : ",err)
        res.status(500).json({
            error:"Something went wrong!!"
        })
    }
});

//For liking/disliking post
router.post("/:id/like",requireAuth,async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;
        const postId = req.params.id;

        const existing = await prisma.like.findFirst({
            where:{postId,userId}
        });

        if(existing){
            await prisma.like.delete({
                where:{
                    id:existing.id
                }
            })
            res.json({
                like:false
            })
            return ;
        }
        else{
            await prisma.like.create({
                data:{
                    userId,postId
                }
            })
            res.json({like:true})
            return ;
        }
    }
    catch(err){
        console.error("Error while liking : ",err);
        res.status(500).json({message:"Something went wrong!!"})
    }
});

// For commenting on posts
router.post("/:id/comment",requireAuth,async(req:Request,res:Response)=>{
    try{
        const auth = req.auth ;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const authorId = auth.userId;
        const postId = req.params.id;
        const {content} = req.body;
        if(!content?.trim()){
            res.status(400).json({message:"Comment cannot be empty!!"});
        }

        const comment = await prisma.comment.create({
            data:{
                content,
                postId,
                authorId
            },
            include:{author:true}
        });
        res.json(comment);

    }
    catch(err){
        console.error("Error adding comment : ",err);
        res.status(500).json({error:"Something went wrong!!"})
    }
})
export default postRoutes