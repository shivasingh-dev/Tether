import mongoose from "mongoose";
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
    import('fs').then(fs => fs.appendFileSync('error.log', '\nUPDATE PROFILE ERROR:\n' + error.stack + '\n'));
    return res
      .status(500)
      .json({ success: false, message: error.message || "Internal server error" });
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
        message: "User retrived and allowed to use Tether",
        data: user,
      });
  } catch (error) {
    console.error("error in check authenticated", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// this function is return all user on the basis of saved phone numbers for new chats

export const getAllUserWithContacts = async (req, res) => {
  try {
    const { phoneNumbers } = req.body;
    const userId = req.userId;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ success: false, message: "Phone numbers required" });
    }

    // ✅ Frontend se cleaned numbers aa rahe hain, bas basic check
    const validNumbers = phoneNumbers.filter(n => /^\d{10}$/.test(n));

    if (!validNumbers.length) {
      return res.status(400).json({ success: false, message: "No valid numbers found" });
    }

    const registeredContacts = await userModel.find(
      { phoneNumber: { $in: validNumbers }, _id: { $ne: userId } },
      { _id: 1, fullName: 1, phoneNumber: 1, profilePicture: 1, about: 1, isOnline: 1 }
    ).lean();

    // savedContacts update karo
    const contactIds = registeredContacts.map(c => c._id);
    if (contactIds.length) {
      await userModel.findByIdAndUpdate(userId, {
        $addToSet: { savedContacts: { $each: contactIds } }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      data: registeredContacts
    });

  } catch (error) {
    console.error("Error in getAllUserWithContacts", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// this function is returning recent chats for users 

export const getRecentChats = async (req, res) => {
  const loggedInUser = req.userId;
  try {

    const loggedInUser = req.userId;

    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "User ID not found" });
    }

    // String ko ObjectId mein convert karna zaroori hai
    const userObjectId = new mongoose.Types.ObjectId(loggedInUser);

    // Sirf woh conversations jisme logged in user ho + lastMessage exist kare
    const conversations = await conversationModel
      .find({
        participants: { $in: [userObjectId] },  // ✅ fixed typo
        lastMessage: { $exists: true, $ne: null }
      })
      .populate({
        path: "lastMessage",
        select: "content contentType createdAt sender messageStatus",
      })
      .sort({ updatedAt: -1 })
      .lean();

    if (!conversations.length) {
      return res.status(200).json({
        success: true,
        message: "No recent chats",
        data: []
      });
    }

    // Dusre participant ki info + unread count nikalo
    const recentChats = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find(
          (p) => p.toString() !== loggedInUser.toString()
        );

        const otherUser = await userModel
          .findById(otherUserId)
          .select("fullName profilePicture lastSeen isOnline phoneNumber")
          .lean();

        // Per-user unread count Map se nikalo
        const unreadCount = conv.unreadCount?.[loggedInUser.toString()] || 0;

        return {
          conversationId: conv._id,
          user: otherUser,
          lastMessage: conv.lastMessage,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Recent chats retrieved successfully",
      data: recentChats,
    });

  } catch (error) {
    console.error("Error in getRecentChats", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
