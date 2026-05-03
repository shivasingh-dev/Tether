import { BrevoClient } from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

// API Instance set up (Brevo v5.0+)
export const apiInstance = new BrevoClient({
  apiKey: 'xsmtpsib-1b35a36d8c6c7a27067f5f6330b55dd05b50cf8885caec62deece18abd911826-9sBE0rAsYh0FuPEw'
});

export const FROM_EMAIL = "shivasingh247044@gmail.com";

export const sendEmail = async (toEmail, otp) => {
  try {
    const data = await apiInstance.transactionalEmails.sendTransacEmail({
      subject: "Aapka OTP Code",
      htmlContent: `<html><body><h1>Aapka OTP hai: ${otp}</h1></body></html>`,
      sender: { "name": "Tether", "email": FROM_EMAIL },
      to: [{ "email": toEmail }]
    });
    console.log('Email successfully sent! MessageId:', data.data.messageId);
    return true;
  } catch (error) {
    console.error('Brevo API Error:', error);
    return false;
  }
};