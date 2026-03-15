import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import { AuthRoute } from "./routes/authRoute.js";
import { updateProfileRoute } from "./routes/updateProfileRoute.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());           
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());    
// this is for production       
// app.use(cors({  
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true,
// }));
app.use(cors())  // for testing in development

// Database
connectDB();

// Routes
app.use('/api/auth', AuthRoute);  
app.use('/api/update', updateProfileRoute)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
