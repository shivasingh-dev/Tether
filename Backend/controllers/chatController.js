import { conversationModel } from "../models/conversation.js";
import { messageModel } from "../models/message.js";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";
import userModel from "../models/user.js";

// Send Message API
export const sendMessagge = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participants = [senderId, receiverId].sort();

    if (
      !senderId ||
      !receiverId ||
      senderId === "undefined" ||
      receiverId === "undefined"
    ) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and Receiver ID are required and must be valid.",
      });
    }

    // ⭐ BLOCK CHECK - Yeh add karo
    const sender = await userModel.findById(senderId).select("blockedUsers");
    const receiver = await userModel
      .findById(receiverId)
      .select("blockedUsers");

    // Check if sender has blocked receiver OR receiver has blocked sender
    if (sender.blockedUsers.includes(receiverId)) {
      return res.status(403).json({
        success: false,
        message: "You have blocked this user. Unblock to send messages.",
      });
    }

    if (receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "You cannot send messages to this user.",
      });
    }
    // ⭐ BLOCK CHECK END

    let conversation = await conversationModel.findOne({
      participants: { $all: participants },
    });

    if (!conversation) {
      conversation = new conversationModel({
        participants,
      });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // media upload handled here
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return res
          .status(400)
          .json({ success: false, messagae: "failed to upload media" });
      }
      imageOrVideoUrl = uploadFile?.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else if (file.mimetype.startsWith("audio")) {
        contentType = "audio";
      } else {
        return res
          .status(400)
          .json({ sucess: false, message: "Unsupported Media or file type" });
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return res
        .status(400)
        .json({ sucess: false, message: "Message content is required" });
    }

    const message = new messageModel({
      conversation: conversation?._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType: contentType || "text",
      imageOrVideoUrl,
      messageStatus: messageStatus || "sent",
    });

    await message.save();

    if (message?.content) {
      conversation.lastMessage = message?._id;
    }

    const currentCount =
      conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentCount + 1);
    await conversation.save();

    const populateMessage = await messageModel
      .findById(message?._id)
      .populate("sender", "fullName profilePicture")
      .populate("receiver", "fullName profilePicture");

    // emit socket event for realtime
    if (req.io && req.socketUserMap) {
      const receiverSockets = req.socketUserMap.get(receiverId.toString());
      const isReceiverOnline = receiverSockets && receiverSockets.size > 0;

      if (isReceiverOnline) {
        message.messageStatus = "delivered";
        await message.save();
        populateMessage.messageStatus = "delivered";
        req.io.to(senderId.toString()).emit("message_status_update", {
          messageId: message._id,
          messageStatus: "delivered",
        });
      }
      req.io.to(receiverId.toString()).emit("receive_message", populateMessage);

      // Emit to sender's other devices so they sync real-time
      const reqSocketId = req.headers["x-socket-id"];
      if (reqSocketId) {
        req.io
          .to(senderId.toString())
          .except(reqSocketId)
          .emit("receive_message", populateMessage);
      } else {
        // Fallback if x-socket-id is somehow not provided (optional)
        // We only want to emit to other devices. If no socket ID is provided, emitting to all might cause duplicate,
        // but the frontend handles deduplication.
        req.io.to(senderId.toString()).emit("receive_message", populateMessage);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: populateMessage,
    });
  } catch (error) {
    console.error("Error in sendMessage", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get conversation API (some changes are pending still)
export const getConversation = async (req, res) => {
  const userId = req.userId;
  try {
    // get current user's blocked users list
    const currentUser = await userModel.findById(userId).select("blockedUsers");

    const conversations = await conversationModel
      .find({
        participants: userId,
      })
      .populate("participants", "fullName profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "userName profilePicture",
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Filter out lastMessage if it was deleted for this user
    conversations.forEach((conv) => {
      if (conv.lastMessage && conv.lastMessage.deletedFor) {
        const deletedForIds = conv.lastMessage.deletedFor.map((id) =>
          id.toString(),
        );
        if (deletedForIds.includes(userId.toString())) {
          conv.lastMessage = null;
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "conversation fetched successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Error in getConversation", error);
    import("fs").then((fs) =>
      fs.appendFileSync(
        "error.log",
        "\nGET CONVERSATION ERROR:\n" + error.stack + "\n",
      ),
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get Messages API
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;
  try {
    const conversation = await conversationModel.findByIdAndUpdate(
      conversationId,
      {
        $set: { [`unreadCount.${userId}`]: 0 },
      },
      { new: true },
    );
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    if (!conversation.participants.includes(userId)) {
      return res.status(404).json({
        success: false,
        message: "Not authorized to view this conversation",
      });
    }

    // Filter out messages that user has deleted
    const messages = await messageModel
      .find({ conversation: conversationId, deletedFor: { $ne: userId } })
      .populate("sender", "fullName profilePicture")
      .populate("receiver", "fullName profilePicture")
      .sort("createdAt");

    await messageModel.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["sent", "delivered"] },
      },
      { $set: { messageStatus: "read" } },
    );

    return res
      .status(200)
      .json({ success: true, message: "Message retrived", data: messages });
  } catch (error) {
    console.error("Error in getMessages", error);
    return res
      .status(500)
      .json({ sucess: false, message: "Internal server error" });
  }
};

// Mark as read API
export const markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.userId;

  try {
    let messages = await messageModel.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    await messageModel.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } },
    );

    return res.status(200).json({
      success: true,
      message: "Messages mark as read",
      data: messages,
    });
  } catch (error) {
    console.error("Error in markAsRead", error);
    return res
      .status(500)
      .json({ sucess: false, message: "Internal server error" });
  }
};

// Delete one message API from both side //
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.userId;

  try {
    const message = await messageModel.findById(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
    if (message.sender.toString() !== userId) {
      return res.status(400).json({
        sucess: false,
        message: "Not authorized to delete this message",
      });
    }
    await messageModel.findByIdAndDelete(messageId);

    // emit socket event to receiver in real-time

    if (req.io) {
      const receiverId = message?.receiver?.toString();
      if (receiverId) {
        req.io
          .to(receiverId)
          .emit("message_deleted", { deletedMessageId: messageId });
      }

      // emit to sender's other devices
      const reqSocketId = req.headers["x-socket-id"];
      if (reqSocketId) {
        req.io
          .to(userId.toString())
          .except(reqSocketId)
          .emit("message_deleted", { deletedMessageId: messageId });
      } else {
        req.io
          .to(userId.toString())
          .emit("message_deleted", { deletedMessageId: messageId });
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Message Deleted successfully" });
  } catch (error) {
    console.error("Error in messageDelete", error);
    return res
      .status(500)
      .json({ sucess: false, message: "Internal server error" });
  }
};

// Clear all messages API from one side
export const clearChat = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  try {
    // Check if conversation exists
    const conversation = await conversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to clear this conversation",
      });
    }

    // Update all messages - add userId to deletedFor array
    const result = await messageModel.updateMany(
      {
        conversation: conversationId,
        deletedFor: { $ne: userId },
      },
      {
        $addToSet: { deletedFor: userId },
      },
    );

    // Check if both users have deleted - then permanently delete
    const messagesToDelete = await messageModel.find({
      conversation: conversationId,
      deletedFor: { $all: conversation.participants },
    });

    if (messagesToDelete.length > 0) {
      const deletedIds = messagesToDelete.map((m) => m._id);

      await messageModel.deleteMany({
        _id: { $in: deletedIds },
      });

      // Update lastMessage if it was deleted
      if (
        conversation.lastMessage &&
        deletedIds.some((id) => id.equals(conversation.lastMessage))
      ) {
        // Find the most recent message that's not deleted by anyone
        const latestMessage = await messageModel
          .findOne({
            conversation: conversationId,
            $or: [
              { deletedFor: { $exists: false } },
              { deletedFor: { $size: 0 } },
            ],
          })
          .sort({ createdAt: -1 });

        conversation.lastMessage = latestMessage?._id || null;
      }
    }

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Emit socket event only to the user who cleared — other user's view unchanged
    if (req.io) {
      req.io.to(userId.toString()).emit("chat_cleared", {
        conversationId: conversationId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat cleared successfully",
      data: {
        conversationId,
        messagesCleared: result.modifiedCount,
        permanentlyDeleted: messagesToDelete.length,
      },
    });
  } catch (error) {
    console.error("Error in clearChat", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
