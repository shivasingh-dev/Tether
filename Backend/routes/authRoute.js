import express from "express";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../controllers/phoneAuthController.js";
import {
  registerEmail,
  verifyEmailOtp,
  emailLogin,
} from "../controllers/emailAuthController.js";

export const AuthRoute = express.Router();


AuthRoute.post("/get-phone-otp", sendPhoneOtp)
AuthRoute.post("/verify-phone-otp", verifyPhoneOtp)
AuthRoute.post("/register-email", registerEmail);
AuthRoute.post("/verify-email", verifyEmailOtp);
AuthRoute.post("/email-login", emailLogin);
