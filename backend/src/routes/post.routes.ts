import { Router, type Request, type Response } from "express";
import { requireAuth } from "@clerk/express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";


const router = Router();
router.use(requireAuth())


//For creating a post
router.post("/",requireAuth(),upload.single("image"),async (req:Request,res:Response)=>{
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


// Toggles a bookmark on a post
router.post("/:id/bookmark", requireAuth(), async (req, res) => {
    try {
        const postId = req.params.id as string;
        const userId = req.auth?.userId;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const existingBookmark = await prisma.bookmark.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existingBookmark) {
            // If it exists, delete it (un-bookmark)
            await prisma.bookmark.delete({
                where: { id: existingBookmark.id },
            });
            return res.json({ bookmarked: false });
        } else {
            // If it doesn't exist, create it (bookmark)
            await prisma.bookmark.create({
                data: { userId, postId },
            });
            return res.json({ bookmarked: true });
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});


// --- GET /api/posts/bookmarks ---
// Fetches all posts bookmarked by the current user
router.get("/bookmarks", requireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const bookmarks = await prisma.bookmark.findMany({
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

    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
//For fetching posts
router.get("/feed",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;
        const page = parseInt((req.query.page as string) || "1",10);
        const limit = parseInt((req.query.limit as string) || "5",10);

        // Debug: Check if user has any follows
        const userFollows = await prisma.follows.findMany({
            where: { followerId: userId },
            include: { following: true }
        });
        console.log("User follows:", userFollows.map(f => ({followingId: f.followingId, followingName: f.following.name})));

        // Debug: Check user's own posts
        const userOwnPosts = await prisma.post.findMany({
            where: { authorId: userId }
        });
        console.log("User's own posts:", userOwnPosts.length);

        const posts = await prisma.post.findMany({
            where:{
                OR:[
                    { authorId: userId },
                    // Authors that the current user follows
                    { author: { following: { some: { followerId: userId } } } }
                ],
            },
            include : {
                author:true,
                likes:true,
                comments:{
                    include: {author:true}
                },
                bookmarks:{
                    where:{userId:userId ?? undefined}
                }
            },
            orderBy : {createdAt:"desc"},
            skip:(page-1)*limit,
            take:limit
        })
        console.log("Feed query for user:", userId);
        console.log("Posts found:", posts.length);
        console.log("Post authors:", posts.map(p => ({authorId: p.authorId, authorName: p.author.name})));
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
router.post("/:id/like",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const userId = auth.userId;
        const postId = req.params.id as string;

        const existing = await prisma.like.findFirst({
            where:{postId:postId as string,userId}
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
                    userId,postId:postId as string
                }
            })

            try{
                const post = await prisma.post.findUnique({
                    where:{
                        id:postId as string
                    },
                    select:{
                        authorId:true
                    }
                })

                if(post && post.authorId !== userId){
                    await prisma.notification.create({
                        data:{
                            type:"LIKE",
                            userId:post.authorId,
                            actorId:userId,
                            postId:postId as string
                        }
                    })
                }
            }
            catch(notificationError){
                console.error("Failed to create like notification:", notificationError);
            }
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
router.post("/:id/comment",requireAuth(),async(req:Request,res:Response)=>{
    try{
        const auth = req.auth ;
         if (!auth || !auth.userId) {
            res.json({error:"UserId is not present!!"});
            return;
        }
        const authorId = auth.userId;
        const postId = req.params.id as string;
        const {content} = req.body;
        if(!content?.trim()){
            res.status(400).json({message:"Comment cannot be empty!!"});
        }
        
        const comment = await prisma.comment.create({
            data:{
                content,
                postId:postId as string,
                authorId
            },
            include:{author:true}
        });


        try{
           const post = await prisma.post.findUnique({
            where:{
                id:authorId
            },
            select:{
                authorId:true
            }
           });

           if(post && post.authorId !== authorId){
            await prisma.notification.create({
                data:{
                    type:"COMMENT",
                    userId:post.authorId,
                    actorId:authorId,
                    postId:postId as string
                }
            })
           }
        }
        catch(notificationError){
            console.error("Failed to create comment notification:", notificationError);
        }
        res.json(comment);

    }
    catch(err){
        console.error("Error adding comment : ",err);
        res.status(500).json({error:"Something went wrong!!"})
    }
})
export default router;