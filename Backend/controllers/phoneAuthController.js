import userModel from "../models/user.js";
import {otpGenerator} from "../utils/otpGenerater.js";
import {sendPhoneOtpfun} from "../utils/phoneNumberOtp.js";

//  Phone number otp send function

export const sendPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber, fullName } = req.body;

    if (!phoneNumber || !fullName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existUser = await userModel.findOne({ phoneNumber });

    const verificationCode = otpGenerator();
    console.log(verificationCode)

    if (existUser) {
      // if user is already verified
      if (existUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User already exists, please login with Gmail",
        });
      }

      // for unverified user, send new otp
      existUser.fullName = fullName;
      existUser.phoneOtp = verificationCode;
      existUser.createdAt = Date.now();
      await existUser.save();
      await sendPhoneOtpfun(phoneNumber, verificationCode);

      return res.status(200).json({
        success: true,
        message: "New OTP sent to your number",
      });
    }

    // for new user
    const user = new userModel({
      fullName,
      phoneNumber,
      phoneOtp: verificationCode,
    });
    await user.save();
    await sendPhoneOtpfun(user.phoneNumber, verificationCode);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("Error in sendOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//  Phone number otp verify function

export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phoneCode, phoneNum } = req.body;
    if (!phoneCode || !phoneNum) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const user = await userModel.findOne({
      phoneNumber: phoneNum,
      phoneOtp: phoneCode,
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    user.phoneOtp = null;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Phone Number Verified" });
  } catch (error) {
    console.log("Error in verify phone otp function", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
