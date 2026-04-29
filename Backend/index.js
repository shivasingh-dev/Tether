import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import { initializeSocket } from "./services/socketService.js";
import http from 'http'

// router import
import { statusRouter } from "./routes/statusRoute.js";
import { AuthRoute } from "./routes/authRoute.js";
import { updateProfileRoute } from "./routes/updateProfileRoute.js";
import { chatRouter } from "./routes/chatRoute.js";
import {blockRouter} from './routes/blockRoute.js'
import { startCleanupTask } from "./tasks/cleanupTask.js";

// env configuration

dotenv.config();

// app configuration

const app = express();
const PORT = process.env.PORT || 8000;

const corsOption = {
  // Mobile testing ke liye '*' ya specific IP allow karna zaruri hai
  origin: true, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-socket-id"]
};

// Database
connectDB();

// Start Background Tasks
startCleanupTask();

// Middleware
app.use(express.json());           
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());    
// this is for production       
// app.use(cors({  
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true,
// }));
app.use(cors(corsOption))  // for testing in development


// create server

const server = http.createServer(app)

const io = initializeSocket(server)

// apply socket  middleware before routes
app.use((req, res, next) => {
  req.io = io
  req.socketUserMap = io.socketUserMap
  next()
})


// Routes
app.use('/api/auth', AuthRoute);  
app.use('/api/update', updateProfileRoute)
app.use('/api/chats', chatRouter)
app.use('/api/status', statusRouter)
app.use('/api/block', blockRouter)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});