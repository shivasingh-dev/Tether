import cron from "node-cron";
import { messageModel } from "../models/message.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Daily Cleanup Task
 * Runs every day at midnight (00:00)
 * Deletes media from Cloudinary if older than 15 days
 */
export const startCleanupTask = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🚀 Starting daily media cleanup task...");
    
    try {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Find messages with media that are older than 15 days and haven't been cleaned up yet
      const messagesToCleanup = await messageModel.find({
        createdAt: { $lt: fifteenDaysAgo },
        cloudinaryPublicId: { $ne: null },
        contentType: { $in: ["image", "video", "audio"] }
      });

      console.log(`🔍 Found ${messagesToCleanup.length} messages to clean up.`);

      for (const msg of messagesToCleanup) {
        try {
          // Determine resource type
          const resourceType = msg.contentType === "video" ? "video" : "image";
          
          // Delete from Cloudinary
          await cloudinary.uploader.destroy(msg.cloudinaryPublicId, {
            resource_type: resourceType
          });

          // Update message in DB
          msg.imageOrVideoUrl = null;
          msg.cloudinaryPublicId = null;
          await msg.save();
          
          console.log(`✅ Cleaned up media for message: ${msg._id}`);
        } catch (err) {
          console.error(`❌ Failed to cleanup message ${msg._id}:`, err.message);
        }
      }

      console.log("🏁 Daily media cleanup task completed.");
    } catch (error) {
      console.error("❌ Error in cleanup task:", error);
    }
  });
};
