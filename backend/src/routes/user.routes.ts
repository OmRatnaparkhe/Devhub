import { requireAuth, } from "@clerk/express";
import { Router, type Request, type Response } from "express";
import { prisma } from "../server";
import upload, { uploadFileToCloudinary } from "../middleware/uploadFile";
import { users } from "@clerk/clerk-sdk-node";
const router = Router();
router.get("/search", requireAuth, async (req: Request, res: Response) => {
    try {
        const query = (req.query.query as string) || "";
        if (!query?.trim()) {
            res.json([])
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { username: { contains: query, mode: "insensitive" } }
                ],
            },
            take: 10
        });
        res.json(users);
    }
    catch (err) {
        console.error("Error while searching : ", err);
        res.status(500).json({ error: "Something went wrong!!" });
    }
});


//For onboarding profile updation
router.post("/profile",upload.fields([{ name: "profilePic", maxCount: 1 }]),requireAuth(),
  async (req: Request, res: Response) => {
    console.log("👉 Profile route entered");

    try {
      const auth = req.auth;
      console.log("👉 Clerk auth:", auth);

      if (!auth?.userId) {
        console.log("❌ No userId");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = auth.userId;

      console.log("👉 req.body:", req.body);
      console.log("👉 req.files:", req.files);

      // ✅ Get Clerk user data
      const clerkUser = await users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const clerkName =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || "";

      const { name, username, description, githubLink, role } = req.body;

      // ✅ Prepare update data (use null instead of undefined)
      let profilePicUrl: string | null = null;

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

      console.log("👉 Running prisma.upsert");
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
//Get profile with posts, projects, blogs

router.get("/:id/profile", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                posts: { orderBy: { createdAt: "desc" } },
                projects: true,
                blogs: true
            }
        });
        if (!user) {
            res.status(404).json({ error: "User not found!!" });
            return;
        }
        res.json(user)
    }
    catch (err) {
        console.error("Error while fetching user : ", err);
        res.status(500).json({ error: "Something went wrong!!" })
    };
});

router.post("/:id/follow", requireAuth, async (req: Request, res: Response) => {
    try {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            res.json({ error: "UserId is not present!!" });
            return;
        }
        const currentUserId = auth.userId;
        const targettedUserId = req.params.id;

        if (currentUserId === targettedUserId) {
            console.error("Cannot follow yourself!!")
        }
        const existing = await prisma.follows.findFirst({
            where: {
                followerId: currentUserId,
                followingId: targettedUserId
            }
        })

        if (existing) {
            await prisma.follows.delete({
                where: {
                    id: existing.id
                }
            })
            res.json({ following: false })
        }
        else {
            await prisma.follows.create({
                data: {
                    followerId: currentUserId,
                    followingId: targettedUserId
                }
            })
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
const userRoutes = router;
export default userRoutes