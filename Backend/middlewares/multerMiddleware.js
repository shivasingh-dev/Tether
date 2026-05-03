import multer from "multer";

// Using memory storage for Vercel/serverless compatibility
const storage = multer.memoryStorage();

// File filter: only images are allowed (for profile pictures)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

export default upload;