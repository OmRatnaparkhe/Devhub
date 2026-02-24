/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import { clerkMiddleware } from "@clerk/express";
import PostRouter from "./routes/post.routes";
import cors from "cors";
import http from "http"
import UserRouter from "./routes/user.routes";
import ProjectRouter from "./routes/project.routes";
import BlogsRouter from "./routes/blog.routes";
import MessagesRouter from "./routes/message.routes"
import notificationRoutes from "./routes/notification.routes";
import dashboardRoutes from "./routes/dashboard.routes"
import {Server} from "socket.io"
import { PrismaClient } from "@prisma/client";



const app = express();

export const prisma = new PrismaClient();
const server = http.createServer(app)
const io = new Server(server,{
 cors:{
    origin:["http://localhost:5173", "https://devhub-ten-eta.vercel.app","http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST"]
  }
})
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://devhub-ten-eta.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());


const userSocketMap : {[userId:string]:string} = {};

io.on("connection",(socket)=>{
  console.log("User is connected ",socket.id);

  const userId = socket.handshake.query.userId as string
  if(userId){
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is mapped to ${socket.id}`)
  }

  socket.on("sendMessage",({receiverId,message})=>{
    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage",message)
    }
  })

  socket.on("disconnect",()=>{
    console.log("User disconnected",socket.id)
    for(const [key,value] of Object.entries(userSocketMap)){
      if(value == socket.id){
        delete userSocketMap[key]
        break;
      }
    }
  })
})

app.set("socketio",io)
export {userSocketMap}
console.log("Environment check:", {
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ? "SET" : "MISSING",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "SET" : "MISSING", 
  DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
  NODE_ENV: process.env.NODE_ENV || "not set"
});

const { CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY } = process.env;

if (!CLERK_PUBLISHABLE_KEY || !CLERK_SECRET_KEY) {
  console.error("Missing Clerk keys:", {
    CLERK_PUBLISHABLE_KEY: !!CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: !!CLERK_SECRET_KEY
  });
  throw new Error("Missing Clerk keys in environment");
}

app.use(
  clerkMiddleware({
    publishableKey: CLERK_PUBLISHABLE_KEY,
    secretKey: CLERK_SECRET_KEY,
  })
);


app.use("/api/projects", ProjectRouter);
app.use("/api/blogs", BlogsRouter);
app.use("/api/posts", PostRouter);
app.use("/api/users", UserRouter);
app.use("/api/messages",MessagesRouter);
app.use("/api/notifications",notificationRoutes)
app.use("/api/dashboard",dashboardRoutes)
// app.use("/api/webhooks", webhookRouter)


app.get("/api/test", (req: Request, res: Response) => {
  console.log("/api/test route hit");
  res.json({ ok: true });
});

app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Middleware error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Internal server error" });
  }
);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error('Server startup error:', error);
  process.exit(1);
}
