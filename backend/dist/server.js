"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSocketMap = exports.prisma = void 0;
/// <reference path="./types/express.d.ts" />
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const blog_routes_1 = __importDefault(require("./routes/blog.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
// import webhookRouter from "./routes/webhook.routes";
const app = (0, express_1.default)();
exports.prisma = new client_1.PrismaClient();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173", // frontend URL
        credentials: true,
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const userSocketMap = {};
exports.userSocketMap = userSocketMap;
io.on("connection", (socket) => {
    console.log("User is connected ", socket.id);
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} is mapped to ${socket.id}`);
    }
    socket.on("sendMessage", ({ receiverId, message }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", message);
        }
    });
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        for (const [key, value] of Object.entries(userSocketMap)) {
            if (value == socket.id) {
                delete userSocketMap[key];
                break;
            }
        }
    });
});
app.set("socketio", io);
// ✅ Use standard Clerk env keys (no VITE_ prefix on server)
const { CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY } = process.env;
if (!CLERK_PUBLISHABLE_KEY || !CLERK_SECRET_KEY) {
    throw new Error("❌ Missing Clerk keys in environment (.env file)");
}
// ✅ Clerk middleware applied globally
app.use((0, express_2.clerkMiddleware)({
    publishableKey: CLERK_PUBLISHABLE_KEY,
    secretKey: CLERK_SECRET_KEY,
}));
// ✅ API routes
app.use("/api/projects", project_routes_1.default);
app.use("/api/blogs", blog_routes_1.default);
app.use("/api/posts", post_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/messages", message_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
// app.use("/api/webhooks", webhookRouter)
// ✅ Debug test route
app.get("/api/test", (req, res) => {
    console.log("✅ /api/test route hit");
    res.json({ ok: true });
});
// ✅ Global error handler (catch Clerk + other middleware errors)
app.use((err, req, res, next) => {
    console.error("🔥 Middleware error:", err);
    res
        .status(err.statusCode || 500)
        .json({ error: err.message || "Internal server error" });
});
server.listen(3000, () => console.log("🚀 Server is running on http://localhost:3000"));
