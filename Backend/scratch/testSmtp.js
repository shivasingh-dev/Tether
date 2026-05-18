import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:/Users/shiva/Desktop/NextLevelProjects/TetherChat/Backend/.env' });

async function test() {
  try {
    console.log("Creating transporter...");
    console.log("Email:", process.env.OAUTH_EMAIL);
    console.log("App Password (GMAIL_KEY) exists:", !!process.env.GMAIL_KEY);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.OAUTH_EMAIL,
        pass: process.env.GMAIL_KEY,
      },
    });

    console.log("Sending test SMTP email...");
    const info = await transporter.sendMail({
      from: `"Tether Support" <${process.env.OAUTH_EMAIL}>`,
      to: "shivasingh247044@gmail.com",
      subject: "Test SMTP Subject",
      html: "<h1>Test SMTP email content</h1>",
    });

    console.log("Success! Message ID:", info.messageId);
  } catch (error) {
    console.error("Test SMTP email failed! Error details:", error);
  }
}

test();
