import { Server, Socket } from "socket.io";
import userModel from "../models/user.js";
import { messageModel } from "../models/message.js";
import dotenv from "dotenv";
import { set } from "mongoose";

dotenv.config();

// map to store online users

const onlineUsers = new Map();

// map to store typing users => userId => [conversation] : boolean

const typingUsers = new Map();

// main configuration

export const initializeSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8081",
    process.env.FRONTEND_URL,
  ];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
    pingTimeout: 60000, // disconnect inactive socekts after 60 seconds
  });

  // when a new socket connection is established

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = null;

    // handle user connection & mark them online in DB

    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;

        // online user set mein multiple device add karo overrite nahi
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
        socket.join(userId); // join personal room  for direct emit

        // update user status in db
        await userModel.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // notify all users that this user is online now
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error in handle user connection", error);
      }
    });

    // return online status of requested user

    socket.on("get_user_status", (requestedUserId, callBack) => {
      const userSockets = onlineUsers.get(requestedUserId);
      const isOnline = userSockets && userSockets.size > 0;
      callBack({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // forward message to user if online

    socket.on("send_message", async (message) => {
      try {
        io.to(message.receiver?._id?.toString()).emit("receive_message", message);
      } catch (error) {
        console.error("Error in send message in socket server", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // update message as read and notify sender

    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await messageModel.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );

        messageIds.forEach((messageId) => {
          io.to(senderId).emit("message_status_update", {
            messageId,
            messageStatus: "read",
          });
        });
      } catch (error) {
        console.error("Error in updating message status to read", error);
      }
    });

    // handle typing start event auto stop after 3s

    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});

      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      // clear any existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      // auto stop after 3 seconds
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // Add or update reaction on message

    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId: reactionUserId }) => {
        try {
          const message = await messageModel.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId.toString(),
          );

          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex];
            if (existing.emoji === emoji) {
              // remove same reaction
              message.reactions.splice(existingIndex, 1);
            } else {
              // change emojis
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            // add new reaction
            message.reactions.push({ user: reactionUserId, emoji });
          }

          await message.save();

          const populateMessage = await messageModel
            .findById(message?._id)
            .populate("sender", "fullName profilePicture")
            .populate("receiver", "fullName profilePicture")
            .populate("reactions.user", "fullName");

          const reactionUpdated = {
            messageId,
            reactions: populateMessage.reactions,
          };

          io.to(populateMessage.sender._id.toString()).emit(
            "reaction_updated",
            reactionUpdated,
          );
          io.to(populateMessage.receiver._id.toString()).emit(
            "reaction_updated",
            reactionUpdated,
          );
        } catch (error) {
          console.error("Error in reactions handling", error);
        }
      },
    );

    // handle disconnection and mark user online

    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
        }

        // clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });

          typingUsers.delete(userId);
        }

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await userModel.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
        }

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        (socket.leave(userId), console.log(`user ${userId} disconnected`));
      } catch (error) {
        console.error("Error in disconnection socket", error);
      }
    };

    // disconnect event
    socket.on("disconnect", handleDisconnected);
  });

  // attaching the online user map to the socket server for external use

  io.socketUserMap = onlineUsers;

  return io;
};
