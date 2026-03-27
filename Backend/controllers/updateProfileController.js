import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";
import userModel from "../models/user.js";
import { conversationModel } from "../models/conversation.js";

export const updateProfile = async (req, res) => {
  const { fullName, agreed, about } = req.body;
  const userId = req.userId;

  try {
    const user = await userModel.findById(userId);
    const file = req.file;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      console.log(uploadResult);
      user.profilePicture = uploadResult?.secure_url || "";
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (fullName) user.fullName = fullName;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("error in update profiel", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const logOut = (req, res) => {
  try {
    res.cookie("auth_token", "");
    return res
      .status(200)
      .json({ success: true, message: "User log out successfully" });
  } catch (error) {
    console.error("Error in log out", error);
    return res
      .status(500)
      .json({ success: false, message: "Interval server error" });
  }
};

export const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised, please login first to access our app",
      });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({
        success: true,
        message: "User retrived and allowed to use whatsapp",
        data: user,
      });
  } catch (error) {
    console.error("error in check authenticated", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllUser = async (req, res) => {
  const loggedInUser = req.userId;
  try {
    const users = await userModel
      .find({ _id: { $ne: loggedInUser } })
      .select("fullName profilePicture lastSeen isOnline about phoneNumber")
      .lean();

    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await conversationModel
          .findOne({
            particpants: { $all: [loggedInUser, user?._id] },
          })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();

        return {
          ...user,
          conversation: conversation || null,
        };
      }),
    );
    return res
      .status(200)
      .json({
        sucess: true,
        message: "users retrived successfully",
        data: usersWithConversation,
      });
  } catch (error) {
    console.error("Error in getAllUser", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
