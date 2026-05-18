import { sendEmail } from "../config/emailConfig.js";
import {
  sendEmailOtpTemplate,
  sendWelcomeEmailTemplate,
} from "../config/emailTemplate.js";

export const sendVerificationCodeEmail = async (email, otp) => {
  try {
    await sendEmail(email, "Verify your Email", sendEmailOtpTemplate(otp));
  } catch (error) {
    console.error("Error in sending mail:", error.message || error);
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n\x1b[33m[DEVELOPMENT ONLY] Bypass Email Sending Failure\x1b[0m`);
      console.log(`\x1b[32mEmail verification code for ${email} is: ${otp}\x1b[0m\n`);
      return;
    }
    throw error;
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  try {
    await sendEmail(email, "Welcome to Tether", sendWelcomeEmailTemplate(firstName));
  } catch (error) {
    console.error("Error in sending welcome email:", error.message || error);
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n\x1b[33m[DEVELOPMENT ONLY] Bypass Welcome Email Sending Failure\x1b[0m\n`);
      return;
    }
    throw error;
  }
};
