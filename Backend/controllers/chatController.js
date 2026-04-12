import { conversationModel } from "../models/conversation.js";
import { messageModel } from "../models/message.js";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";

export const sendMessagge = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participants = [senderId, receiverId].sort();

    let conversation = await conversationModel.findOne({
      participants: { $all: participants},
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

      if (file.mimetype.startswith("image")) {
        contentType = "image";
      } else if (file.mimetype.startswith("video")) {
        contentType = "video";
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

    const currentCount = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentCount + 1);
    await conversation.save();

    const populateMessage = await messageModel
      .findById(message?._id)
      .populate("sender", "fullName profilePicture")
      .populate("receiver", "fullName profilePicture");

    // emit socket event for realtime
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId)
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populateMessage)
        message.messageStatus = "delivered"
        await message.save()
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

export const getConversation = async (req, res) => {
  const userId = req.userId;
  try {
    const conversations = await conversationModel
      .find({
        participants: userId,
      })
      .populate("participants", "fullName profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender reciever",
          select: "userName profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "conversation fetched successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Error in getConversation", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// get messages of specific conversation

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;
  try {
    const conversation = await conversationModel.findById(conversationId);
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

    const messages = await messageModel
      .find({ conversation: conversationId })
      .populate("sender", "fullName profilePicture")
      .populate("reciever", "fullName profilePicture")
      .sort("createdAt");

    await messageModel.updateMany(
      {
        conversation: conversationId,
        reciever: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      { $set: { messageStatus: "read" } }              // ✅ update added
    );

    conversation.unreadCount = 0;
    await conversation.save();

    return res
      .status(200)
      .json({ sucess: true, message: "Message retrived", data: messages });
  } catch (error) {
    console.error("Error in getMessages", error);
    return res
      .status(500)
      .json({ sucess: false, message: "Internal server error" });
  }
};

export const markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.userId;

  try {
    let messages = await messageModel.find({
      _id: { $in: messageIds },
      reciever: userId,
    });

    await messageModel.updateMany(
      { _id: { $in: messageIds }, reciever: userId },
      { $set: { messageStatus: "read" } },
    );

    // emit socket event for notify to original sender
    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message?.sender?.toString())
        if (senderSocketId) {
          const updatedMessage = {
            _id: message._id,
            messageStatus: "read",
          }
          req.io.to(senderSocketId).emit("message_read", updatedMessage)
          await message.save()
        }
      }
    }

    return res
      .status(200)
      .json({
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
      return res
        .status(400)
        .json({
          sucess: false,
          message: "Not authorized to delete this message",
        });
    }
    await messageModel.findByIdAndDelete(messageId);

    // emit socket event

    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(message?.reciever?.toString())
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId)
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
