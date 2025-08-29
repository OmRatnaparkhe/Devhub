/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import { clerkMiddleware } from "@clerk/express";
import postRoutes from "./routes/post.routes";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import ProjectRouter from "./routes/project.routes";
import BlogsRouter from "./routes/blog.routes";
import { PrismaClient } from "@prisma/client";
// import webhookRouter from "./routes/webhook.routes";


const app = express();

export const prisma = new PrismaClient();

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);
app.use(express.json());

// ✅ Use standard Clerk env keys (no VITE_ prefix on server)
const { CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY } = process.env;

if (!CLERK_PUBLISHABLE_KEY || !CLERK_SECRET_KEY) {
  throw new Error("❌ Missing Clerk keys in environment (.env file)");
}

// ✅ Clerk middleware applied globally
app.use(
  clerkMiddleware({
    publishableKey: CLERK_PUBLISHABLE_KEY,
    secretKey: CLERK_SECRET_KEY,
  })
);

// ✅ API routes
app.use("/api/projects", ProjectRouter);
app.use("/api/blogs", BlogsRouter);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/webhooks", webhookRouter)

// ✅ Debug test route
app.get("/api/test", (req: Request, res: Response) => {
  console.log("✅ /api/test route hit");
  res.json({ ok: true });
});

// ✅ Global error handler (catch Clerk + other middleware errors)
app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("🔥 Middleware error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Internal server error" });
  }
);

app.listen(3000, () =>
  console.log("🚀 Server is running on http://localhost:3000")
);
