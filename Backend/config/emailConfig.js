import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // 587 ke liye false hi rahega
  auth: {
    user: "aa115e001@smtp-brevo.com", // Jo 'Login' aapne abhi likha wahi yahan aayega
    pass: "xsmtpsib-1b35a36d8c6c7a27067f5f6330b55dd05b50cf8885caec62deece18abd911826-9sBE0rAsYh0FuPEw", // Aapki SMTP key
  },
});

// Ye check karne ke liye ki connection sahi hai ya nahi
transporter.verify((error, success) => {
  if (error) {
    console.log("Brevo Error:", error);
  } else {
    console.log("Mubarak ho! Server email bhejne ke liye ready hai.");
  }
});