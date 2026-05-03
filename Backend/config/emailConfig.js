import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, 
  auth: {
    // Ye credentials aapke SMTP page se hain
    user: "aa115e001@smtp-brevo.com", 
    pass: "xsmtpsib-1b35a36d8c6c7a27067f5f6330b55dd05b50cf8885caec62deece18abd911826-9sBE0rAsYh0FuPEw", 
  },
});

// SENDER: Wahi email jo Brevo par pehle se verified hai
export const FROM_EMAIL = "shivasingh247044@gmail.com";

const mailOptions = {
  from: FROM_EMAIL, 
  to: "recipient-email@gmail.com",
  subject: "Test Success",
  text: "Bhai, finally bypass ho gaya!",
};

// Connection verify karne ke liye
transporter.verify((error) => {
  if (error) console.log("Abhi bhi issue hai:", error);
  else console.log("Mubarak ho! Connection Success.");
});