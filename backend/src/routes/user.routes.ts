import { requireAuth, } from "@clerk/express";
import { Router, type Request, type Response } from "express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";
import { users } from "@clerk/clerk-sdk-node";
const router = Router();
router.get("/search", requireAuth(), async (req: Request, res: Response) => {
    try {
        const currentUserId = req.auth?.userId;
        const query = (req.query.query as string) || "";
        const limit = parseInt(req.query.limit as string) || 5; // Allow frontend to request a limit

        // Base query conditions
        const where: any = {
            onboarded: true, // Ensure we only suggest fully onboarded users
        };

        // Filter by role query if provided
       if (query) {
      // Search by role OR name OR username
      where.OR = [
        { role: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ];
    }

        if (currentUserId) {
            // 1. Exclude the current user from results
            where.NOT = { id: currentUserId };

            // 2. Filter out users that the current user already follows.
            // This checks the 'followers' relation on the User model.
            // We find users where 'none' of their followers match the currentUserId.
            where.followers = {
                none: {
                    followerId: currentUserId,
                },
            };
        }

        const suggestedUsers = await prisma.user.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' } // Or by a relevance score/random logic
        });
        
        // Note: Because we filter out followed users, we don't strictly need to add an 'isFollowing' flag here,
        // as it would always be false for the returned results.

        res.json(suggestedUsers);
    } catch (err) {
        console.error("Error while searching users: ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});



//For onboarding profile updation
router.post("/profile", upload.fields([{ name: "profilePic", maxCount: 1 }]), requireAuth(),
  async (req: Request, res: Response) => {


    try {
      const auth = req.auth;


      if (!auth?.userId) {
        console.log("❌ No userId");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = auth.userId;



      // ✅ Get Clerk user data
      const clerkUser = await users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const clerkName =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || "";

      const { name, username, description, githubLink, role } = req.body;

      let profilePicUrl: string | null = null;

      console.log("Debug values before upsert:");
      console.log("  name:", name || clerkName || "");
      console.log("  username:", username || clerkUser.username);
      console.log("  email:", email);
      console.log("  description:", description || null);
      console.log("  githubLink:", githubLink || null);
      console.log("  role:", role || "");
      console.log("  profilePicUrl:", profilePicUrl);


      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files?.profilePic && files.profilePic[0]) {
        try {
          profilePicUrl = await uploadFileToCloudinary(
            files.profilePic[0],
            "profile-image",
            { width: 300, height: 300 }
          );
        } catch (uploadError) {
          console.error(
            "Error uploading profile picture to Cloudinary:",
            uploadError
          );
          return res
            .status(500)
            .json({ error: "Failed to upload profile picture." });
        }
      }


      // console.log("👉 Running prisma.upsert");
      const user = await prisma.user.upsert({
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
    } catch (err) {
      console.error("❌ Error updating/creating user profile:", err);
      return res.status(500).json({
        error: "Something went wrong during profile setup.",
      });
    }
  }
);


// REPLACE your existing GET /:id/profile with this one

router.get("/:id/profile", requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;

    // Decide whether to fetch full profile or just onboarding status
    const fetchFullProfile = req.query.full === 'true';

    let user;

    if (fetchFullProfile) {
      // Fetch the full profile with all relations
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          posts: { include:{
            author:true,
            likes:true,
            comments:true,
            
          },orderBy: { createdAt: "desc" } },
          projects: true,
          blogs: true,
          followers:{
            include:{follower:true}
          },
          following:{
            include:{following:true}
          }

        }
      });
    } else {
      // Fetch only the necessary data for the onboarding check
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, onboarded: true }
      });
    }

    if (!user) {
      // If user is not in DB, they haven't been onboarded yet.
      // For the onboarding check, this is a valid response.
      if (!fetchFullProfile) {
        return res.json({ onboarded: false });
      }
      return res.status(404).json({ error: "User not found!!" });
    }

    res.json(user);
  }
  catch (err) {
    console.error("Error while fetching user profile: ", err);
    res.status(500).json({ error: "Something went wrong!!" })
  };
});
router.post("/:id/follow", requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = req.auth;
    if (!auth || !auth.userId) {
      res.json({ error: "UserId is not present!!" });
      return;
    }
    const currentUserId = auth.userId;
    const targettedUserId = req.params.id as string;

    console.log("Follow attempt:", { currentUserId, targettedUserId });

    if (currentUserId === targettedUserId) {
      console.error("Cannot follow yourself!!")
    }
    const existing = await prisma.follows.findFirst({
      where: {
        followerId: currentUserId,
        followingId: targettedUserId
      }
    })

    console.log("Existing follow:", existing);

    if (existing) {
      await prisma.follows.delete({
        where: {
          id: existing.id
        }
      })
      console.log("Unfollowed successfully");
      res.json({ following: false })
    }
    else {
      await prisma.follows.create({
        data: {
          followerId: currentUserId,
          followingId: targettedUserId as string
        }
      })

      console.log("Followed successfully");
      //Notification logic
      if(currentUserId!==targettedUserId){
        try{
        await prisma.notification.create({
          data:{
            type:"FOLLOW",
            userId:targettedUserId as string,
            actorId:currentUserId
          }
        })
        }
        catch(notificationError){
          console.error("Failed to create follow notification:", notificationError);
        }
      }
      res.json({ following: true })
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

// For updating profile info
router.put("/:id/update", upload.single("profilePic"), requireAuth(), async (req, res) => {
  const { id } = req.params;
  const { name, username, description, githubLink, role, profilePic } = req.body;

  let profilepicurl = profilePic;

  if (req.file) {
    try {
      profilepicurl = await uploadFileToCloudinary(
        req.file,
        "profile-image",
        { width: 300, height: 300 }
      );
    } catch (uploadError) {
      console.error("Error uploading profile picture to Cloudinary:", uploadError);
      return res.status(500).json({ error: "Failed to upload profile picture." });
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: {
        name,
        username,
        description: description || null,
        githubLink: githubLink || null,
        role,
        profilePic: profilepicurl,
      },
      include: {
        posts: true,
        projects: true,
        blogs: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("❌ Failed to update profile", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});



// GET a list of users who are following the current user
router.get("/followers", requireAuth(), async (req: Request, res: Response) => {
    try {
        const currentUserId = req.auth?.userId;
        if (!currentUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find all 'Follows' records where the current user is being followed
        const follows = await prisma.follows.findMany({
            where: {
                followingId: currentUserId,
            },
            // Include the full user object of the person who is the follower
            include: {
                follower: true,
            },
        });

        // Extract just the user objects from the follows records
        const followers = follows.map(follow => follow.follower);

        res.json(followers);
    } catch (err) {
        console.error("Error fetching followers:", err);
        res.status(500).json({ error: "Something went wrong!" });
    }
});

// GET a list of users the current user is following
router.get("/following", requireAuth(), async (req: Request, res: Response) => {
    try {
        const currentUserId = req.auth?.userId;
        if (!currentUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find all 'Follows' records where the current user is the follower
        const follows = await prisma.follows.findMany({
            where: {
                followerId: currentUserId,
            },
            // Include the full user object of the person being followed
            include: {
                following: true,
            },
        });

        // Extract just the user objects from the follows records
        const following = follows.map(follow => follow.following);

        res.json(following);
    } catch (err) {
        console.error("Error fetching following:", err);
        res.status(500).json({ error: "Something went wrong!" });
    }
});


export default router;