import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = (file) => {
  const options = {
    resource_type: file.mimetype.startWith("video") ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploader = file.mimetype.startWith("video")
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      fs.unlink(file.path, () => {})
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  });
};


export const multerMiddleware = multer({dest: 'uploads/'}).single('media')

