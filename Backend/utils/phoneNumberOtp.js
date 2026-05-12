import axios from 'axios';
import dotenv from 'dotenv'

dotenv.config()

export const sendPhoneOtpfun = async (phoneNumber, verificationCode) => {
  try {

    const formattedNumber = phoneNumber.startsWith('+91') 
      ? phoneNumber 
      : `+91${phoneNumber}`;

    console.log("Sending OTP to:", formattedNumber); 

    const response = await axios.post(
      'https://gatewayapi.telegram.org/sendVerificationMessage',
      {
        phone_number: formattedNumber,
        code: verificationCode,
        ttl: 300,
      },
      {
        headers: {
          'X-TG-Gateway-API-Token': process.env.TELEGRAM_API_KEY, 
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Telegram Gateway Error:", error.response?.data || error.message);
    throw new Error("Telegram Gateway API Error");
  }
};