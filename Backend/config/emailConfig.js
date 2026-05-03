import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: "abcd247044@gmail.com",
    pass: process.env.GMAIL_KEY,
  },
  // --- Ye niche wali settings add karo ---
  pool: true, // Connection reuse karne ke liye
  connectionTimeout: 10000, // 10 seconds tak wait karega
  greetingTimeout: 5000,
  socketTimeout: 30000,
  tls: {
    // Railway par ye line connection stable karti hai
    servername: "smtp.gmail.com",
    rejectUnauthorized: false, // Agar certificate issue ho toh bypass karne ke liye
  },
});

// Ek baar verify karne ke liye ye code add karo (sirf debugging ke liye)
transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});