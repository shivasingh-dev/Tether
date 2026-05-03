import multer from "multer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const resource_type = file.mimetype.startsWith("video") ? "video" : "image";
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type },
      (error, result) => {
        if (error) {
          console.error("Cloudinary stream upload error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

export const multerMiddleware = multer({ storage: multer.memoryStorage() }).single('media');
