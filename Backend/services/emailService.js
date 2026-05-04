import { sendEmail } from "../config/emailConfig.js";
import {
  sendEmailOtpTemplate,
  sendWelcomeEmailTemplate,
} from "../config/emailTemplate.js";

export const sendVerificationCodeEmail = async (email, otp) => {
  try {
    await sendEmail(email, "Verify your Email", sendEmailOtpTemplate(otp));
  } catch (error) {
    console.error("Error in sending mail", error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  try {
    await sendEmail(email, "Welcome to Tether", sendWelcomeEmailTemplate(firstName));
  } catch (error) {
    console.error("Error in sending welcome email", error);
    throw error;
  }
};
