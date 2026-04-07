import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
dotenv.config();

import connectDB from "../config/Dbconfig.js";
import router from "./routes/Userroutes.js";
import productRoutes from "./routes/product.js";
import meetingRoutes from "./routes/meeting.routes.js";
import { initSocketServer } from "./socket/socketServer.js";

const app = express();
const httpServer = createServer(app); // wrap express in http server for Socket.IO

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize signaling server
initSocketServer(io);

// ─── DB ───────────────────────────────────────────────────────────────────────
connectDB();

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/user", router);
app.use("/api", productRoutes);
app.use("/api/meetings", meetingRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Error]", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5100;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for WebRTC signaling`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
});