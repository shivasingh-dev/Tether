import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Database Connected Successfully ✅");
  } catch (error) {
    console.error("Database Connection Failed ❌", error);
    process.exit(1); // exit with failure
  }
};
