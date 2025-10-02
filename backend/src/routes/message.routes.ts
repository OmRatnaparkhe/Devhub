import { requireAuth } from "@clerk/express";
import { Router } from "express";
import { prisma } from "../server";

const router = Router();
router.use(requireAuth())

//Fetch all users(following+follower)
router.get("/conversations",async(req,res)=>{
    try{
        const currentUserId = req.auth?.userId;
        if(!currentUserId){
            console.error("Unauthorized")
            return;
        }

        const following = await prisma.follows.findMany({
            where:{
                followerId:currentUserId
            },
            include:{
                following:true
            }
        })

        const followers = await prisma.follows.findMany({
            where:{
                followingId:currentUserId
            },
            include:{
                 follower:true
            }
               
            
        })

        const followingUsers = following.map(f=>f.following)
        const followerUsers = followers.map(f=>f.follower)
        const allUsers = [...followingUsers, ...followerUsers]
        const uniqueUsers = Array.from(new Map(allUsers.map(user=>[user.id,user])).values());
        const unreadNotifications = await prisma.notification.findMany({
            where:{
                userId:currentUserId,
                type:"MESSAGE",
                read:false
            },
            select:{
                actorId:true
            }
        });
        const unreadSenderId = new Set(unreadNotifications.map(n=>n.actorId));

        const conversationsWithStatus = uniqueUsers.map(user => ({
            ...user,
            hasUnreadMessages:unreadSenderId.has(user.id)
        }));
        
        res.json(conversationsWithStatus);
        res.json(uniqueUsers);
    }
    catch(err){
         console.error("Error fetching conversations:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
})

//Get a message history with a particular user
router.get("/conversations/:userId",async(req,res)=>{
    try{
        const currentUserId = req.auth?.userId;
        const otherUserId = req.params.userId;

        
        if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

        const conversations = await prisma.conversation.findFirst({
            where:{
                OR:[
                    {userOneId:currentUserId,userTwoId:otherUserId},
                    {userOneId:otherUserId,userTwoId:currentUserId}
                ],
            
            },
            include:{
                messages:{
                    orderBy:{createdAt:"asc"}
                },
            },
        })
        res.json(conversations?.messages || [])
    }
    catch(err){
         console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
})

//Post a new message
router.post("/send/:receiverId",async(req,res)=>{
    try{
        const currentUserId = req.auth?.userId;
        const receiverId = req.params.receiverId;
        const {content} = req.body;
        if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

        let conversation = await prisma.conversation.findFirst({
            where:{
                OR:[
                    {userOneId:currentUserId,userTwoId:receiverId},
                    {userTwoId:currentUserId,userOneId:receiverId}
                ]
            }
        })
        if(!conversation){
            conversation = await prisma.conversation.create({
                data:{userOneId:currentUserId,userTwoId:receiverId}
            })
        }

        const newMessage = await prisma.message.create({
            data:{
                content,
                senderId:currentUserId,
                receiverId:receiverId,
                conversationId:conversation.id
            },
            include:{
                sender:true,
                receiver:true
            }
        });

        try{
           await prisma.notification.create({
            data:{
                type:"MESSAGE",
                userId:receiverId,
                actorId:currentUserId
            }
           })
        }
        catch(notificationError){
            console.error("Failed to create message notification:", notificationError);
        }

        const io = req.app.get("socketio");
        io.to(receiverId).emit("New message",newMessage);

        res.status(201).json(newMessage)
    }
    catch(err){
         console.error("Error sending message:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
})


router.post("/mark-read", async (req, res) => {
    try {
        const currentUserId = req.auth?.userId;
        const { senderId } = req.body; // ID of the user whose chat messages we are reading

        if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });
        if (!senderId) return res.status(400).json({ error: "senderId is required" });

        await prisma.notification.updateMany({
            where: {
                userId: currentUserId,   // Recipient is current user
                actorId: senderId,       // Sender is the chat partner
                type: "MESSAGE",
                read: false
            },
            data: { read: true }
        });

        res.status(200).json({ message: "Messages marked as read successfully." });
    } catch (err) {
        console.error("Error marking messages as read:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
export default router