import { transporter } from "../config/emailConfig.js";
import {
  sendEmailOtpTemplate,
  sendWelcomeEmailTemplate,
} from "../config/emailTemplate.js";

export const sendVerificationCodeEmail = async (email, otp) => {
  try {
    const response = await transporter.sendMail({
      from: '"Tether-Support" <abcd247044@gmail.com>',
      to: email,
      subject: "Verify your Email",
      text: "Verify your Email",
      html: sendEmailOtpTemplate(otp),
    });
    console.log("OTP email sent successfully");
  } catch (error) {
    console.error("Error in sending mail", error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const response = await transporter.sendMail({
      from: '"Tether-Team" <abcd247044@gmail.com>',
      to: email,
      subject: "Welcome to Tether",
      text: "Wecome",
      html: sendWelcomeEmailTemplate(firstName),
    });
    console.log("Welcome Email sent successfully");
  } catch (error) {
    console.error("Error in sending welcome email", error);
    throw error;
  }
};
