import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "abcd247044@gmail.com",
    pass: process.env.GMAIL_KEY,
  },
  // --- YE FIX HAI ---
  connectionTimeout: 20000, // Timeout badha do (20 sec)
  greetingTimeout: 20000,
  socketTimeout: 20000,
  dnsVapi: "ipv4only", // Node.js ko force karega IPv4 use karne ke liye
  tls: {
    rejectUnauthorized: false, // Security check bypass (sirf debugging ke liye)
    servername: "smtp.gmail.com"
  }
});

// Ek baar verify karne ke liye ye code add karo (sirf debugging ke liye)
transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});