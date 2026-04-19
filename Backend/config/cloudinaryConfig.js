import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = (file) => {
  const options = {
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploader = file.mimetype.startsWith("video")
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    const absolutePath = path.resolve(file.path);

    uploader(absolutePath, options, (error, result) => {
      fs.unlink(absolutePath, () => {})
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  });
};


export const multerMiddleware = multer({dest: 'uploads/'}).single('media')

