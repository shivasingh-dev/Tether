import userModel from "../models/user.js";
import {otpGenerator} from "../utils/otpGenerater.js";

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

    if (phoneNumber.length !== 10 || isNaN(phoneNumber)) {
      return res.status(400).json({success: false, message: "Please enter a valid 10 digit Number"})
    }

    const existUser = await userModel.findOne({ phoneNumber });

    const verificationCode = otpGenerator();
    console.log(verificationCode)

    if (existUser) {
      // if user is already verified
      if (existUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User with this number already exists, please login with Email",
        });
      }

      // for unverified user, just update name
      existUser.fullName = fullName;
      existUser.phoneOtp = null; // No OTP needed
      await existUser.save();

      return res.status(200).json({
        success: true,
        message: "Phone number registered successfully",
      });
    }

    // for new user
    const user = new userModel({
      fullName,
      phoneNumber,
      phoneOtp: null,
      isVerified: false,
    });
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Phone number registered successfully",
      data: user,
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
    const { phoneOtp, phoneNumber } = req.body;
    if (!phoneOtp || !phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const user = await userModel.findOne({
      phoneNumber: phoneNumber,
      phoneOtp: phoneOtp,
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    user.phoneOtp = null;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Phone Number Verified", data: user });
  } catch (error) {
    console.log("Error in verify phone otp function", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};