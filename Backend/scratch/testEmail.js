import dotenv from 'dotenv';
import path from 'path';

// Load env from the backend folder explicitly
dotenv.config({ path: 'C:/Users/shiva/Desktop/NextLevelProjects/TetherChat/Backend/.env' });

console.log("Loaded Environment Variables Check:");
console.log("OAUTH_EMAIL:", process.env.OAUTH_EMAIL);
console.log("OAUTH_CLIENT_ID exists:", !!process.env.OAUTH_CLIENT_ID);
console.log("OAUTH_CLIENT_SECRET exists:", !!process.env.OAUTH_CLIENT_SECRET);
console.log("OAUTH_REFRESH_TOKEN exists:", !!process.env.OAUTH_REFRESH_TOKEN);

const { sendEmail } = await import('../config/emailConfig.js');

async function test() {
  try {
    console.log("Sending test email...");
    const res = await sendEmail("shivasingh247044@gmail.com", "Test Subject", "<h1>Test HTML content</h1>");
    console.log("Success! Result:", res);
  } catch (error) {
    console.error("Test email failed! Error details:");
    console.error(error);
  }
}

test();
