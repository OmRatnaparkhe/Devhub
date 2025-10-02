import { requireAuth } from "@clerk/express";
import { Router } from "express";
import { prisma } from "../server";

const router = Router();
router.use(requireAuth())

router.get("/",async(req,res)=>{
    try{
        const userId = req.auth?.userId;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const whereClause : any = {userId:userId}
        const read = req.query.read;

        if(read==="true"){
            whereClause.read = true;
        }
        else if(read==="false"){
            whereClause.read = false;
        }

        const notifications = await prisma.notification.findMany({
            where:whereClause,
            include:{
                actor:{
                    select:{
                        id:true,
                    name:true,
                    username:true,
                    profilePic:true
                    }
                    
                },
                post:{
                    select:{
                        id:true,
                        content:true
                    }
                }
            },
            orderBy:{
                createdAt:"desc"
            },
            take:50
        })

        const unreadCount = await prisma.notification.findMany({
            where:{
                read:false,
                userId:userId
            }
        })

        res.json({
            notifications,unreadCount
        })
    }
    catch(err){
         console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
})

router.post("/mark-read",async(req,res)=>{
    try{
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        await prisma.notification.updateMany({
            where:{
                userId:userId,
                read:false
            },
            data:{
                read:true
            }
        });
        res.status(204).send(); 
    }
    catch(err){
        console.error("Error marking notifications as read:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
})


export default router;
