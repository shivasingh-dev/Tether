import { apiInstance, FROM_EMAIL } from "../config/emailConfig.js";
import {
  sendEmailOtpTemplate,
  sendWelcomeEmailTemplate,
} from "../config/emailTemplate.js";

export const sendVerificationCodeEmail = async (email, otp) => {
  try {
    const data = await apiInstance.transactionalEmails.sendTransacEmail({
      subject: "Verify your Email",
      htmlContent: sendEmailOtpTemplate(otp),
      sender: { name: "Tether-Support", email: FROM_EMAIL },
      to: [{ email: email }],
    });
    console.log("OTP email sent successfully! MessageId:", data.data.messageId);
  } catch (error) {
    console.error("Error in sending mail", error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const data = await apiInstance.transactionalEmails.sendTransacEmail({
      subject: "Welcome to Tether",
      htmlContent: sendWelcomeEmailTemplate(firstName),
      sender: { name: "Tether-Team", email: FROM_EMAIL },
      to: [{ email: email }],
    });
    console.log("Welcome Email sent successfully! MessageId:", data.data.messageId);
  } catch (error) {
    console.error("Error in sending welcome email", error);
    throw error;
  }
};
