import userModel from "../models/user.js";
import { otpGenerator } from "../utils/otpGenerater.js";
import { sendVerificationCodeEmail, sendWelcomeEmail } from '../services/emailService.js'
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// create jwt token function

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET_KEY);
};

// Email register function

export const registerEmail = async (req, res) => {
  try {
    const { email, password, phoneNumber } = req.body;
    if (!email || !password || !phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const existUser = await userModel.findOne({ phoneNumber: phoneNumber });

    if (existUser) {
      // if user is verified
      if (existUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User already exist, please login",
        });
      }

      const emailExists = await userModel.findOne({
        email,
        // phoneNum,
      });

      if (emailExists && emailExists.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      // hashing password
      const hashPassword = await bcrypt.hash(password, 10);
      const otp = otpGenerator();

      // Add email and password to existing user and send OTP
      existUser.email = email;
      existUser.password = hashPassword;
      existUser.emailOtp = otp;
      existUser.createdAt = Date.now();
      await existUser.save();
      await sendVerificationCodeEmail(email, otp);
      return res
        .status(200)
        .json({ success: true, message: "OTP sent to your email" });
    }
  } catch (error) {
    console.error("Error in registering user email", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Email OTP Verify Function

export const verifyEmailOtp = async (req, res) => {
  try {

    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const user = await userModel.findOne({
      email: email,
      emailOtp: otp,
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    user.emailOtp = null;
    user.isVerified = true;
    const token = createToken(user._id)
    res.cookie("auth_token", token)
    await user.save();
    await sendWelcomeEmail(email, user.firstName);
    return res
      .status(200)
      .json({ success: true, message: "Email Verified Successfully", Token: token });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Email Login Function

export const emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Cridentials, No User found",
      });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Please verify your email first" });
    }

    const isMatchUser = await bcrypt.compare(password, user.password);
    if (!isMatchUser) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Id or Password" });
    }

    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture || "",
      about: user.about || "Hey there! I am using Tether",
      isOnline: user.isOnline,
    };

    const token = createToken(user._id)
    res.cookie("auth_token", token)
    return res.status(200).json({
      success: true, message: "User login successfully",
      user: {
        ...userData,
        token: token
      }
    });
  } catch (error) {
    console.error("Error in emailLogin", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
