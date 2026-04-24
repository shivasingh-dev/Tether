import { conversationModel } from "../models/conversation.js";
import { messageModel } from "../models/message.js";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";

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
      const reqSocketId = req.headers['x-socket-id'];
      if (reqSocketId) {
        req.io.to(senderId.toString()).except(reqSocketId).emit("receive_message", populateMessage);
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
          path: "sender receiver",
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
    import('fs').then(fs => fs.appendFileSync('error.log', '\nGET CONVERSATION ERROR:\n' + error.stack + '\n'));
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

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

    const messages = await messageModel
      .find({ conversation: conversationId })
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
      const reqSocketId = req.headers['x-socket-id'];
      if (reqSocketId) {
        req.io.to(userId.toString()).except(reqSocketId).emit("message_deleted", { deletedMessageId: messageId });
      } else {
        req.io.to(userId.toString()).emit("message_deleted", { deletedMessageId: messageId });
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
