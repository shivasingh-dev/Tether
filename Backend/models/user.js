import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: (props) => `${props.value} is not a valid email address!`,
      },
      required: false,
    },

    password: { type: String },

    phoneNumber: {
      type: String,
      unique: true,
      required: true,
      // sparse: true,
    },
    
    phoneSuffix: { type: String },
    phoneOtp: { type: String },
    emailOtp: { type: String },
    emailOtpExpiry: { type: Date },
    profilePicture: { type: String },
    about: { type: String },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    lastSeen: { type: Date },
    agreed: { type: Boolean },
  },
  { timestamps: true },
);

userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 900, partialFilterExpression: { isVerified: false } },
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
