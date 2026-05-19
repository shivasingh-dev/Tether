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

// map to store socket id -> source ("web" | "app")
const socketSources = new Map();

// Helper to emit events only to Mobile App sockets of a user
const emitToAppOnly = (io, targetUserId, event, data) => {
  const userSockets = onlineUsers.get(targetUserId.toString());
  if (userSockets) {
    userSockets.forEach((socketId) => {
      if (socketSources.get(socketId) === "app") {
        io.to(socketId).emit(event, data);
      }
    });
  }
};

// main configuration

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
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

    socket.on("user_connected", async (data) => {
      try {
        let source = "unknown";
        if (typeof data === "object" && data !== null) {
          userId = data.userId;
          source = data.source || "unknown";
        } else {
          userId = data;
        }

        // store source for this socket
        socketSources.set(socket.id, source);

        // online user set mein multiple device add karo
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }

        // ✅ PEHLE naya socket add karo — taaki handleDisconnected mein size 0 na ho
        onlineUsers.get(userId).add(socket.id);
        socket.join(userId); // join personal room for direct emit

        // Ab purane same-source sockets ko collect karo aur disconnect karo
        const socketsToDisconnect = [];
        const existingSockets = onlineUsers.get(userId);
        existingSockets.forEach((sid) => {
          if (sid === socket.id) return; // Skip the new socket
          const existingSource = socketSources.get(sid);
          if (existingSource === source && source !== "unknown") {
            socketsToDisconnect.push(sid);
          }
        });

        // Force logout aur disconnect — ab safely kar sakte hain kyunki naya socket already added hai
        socketsToDisconnect.forEach((sid) => {
          io.to(sid).emit("force_logout", { message: "Logged in from another device" });
          const oldSocket = io.sockets.sockets.get(sid);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
          existingSockets.delete(sid);
          socketSources.delete(sid);
        });

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
        io.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      io.to(receiverId).emit("user_typing", {
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

      io.to(receiverId).emit("user_typing", {
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
        
        socketSources.delete(socket.id);

        // clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });

          typingUsers.delete(userId);
        }

        // ✅ Sirf tab offline karo jab SAARE sockets disconnect ho jayein
        const remainingCount = userSockets ? userSockets.size : 0;
        if (remainingCount === 0) {
          onlineUsers.delete(userId);
          await userModel.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // ✅ Offline status sirf tab broadcast karo jab koi socket nahi bacha
          io.emit("user_status", {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        }

        socket.leave(userId);
        console.log(`user ${userId} disconnected (remaining sockets: ${remainingCount})`);
      } catch (error) {
        console.error("Error in disconnection socket", error);
      }
    };

    // disconnect event
    socket.on("disconnect", handleDisconnected);

    // --- VIDEO CALL EVENTS ---

    // 1. Initiate Call
    socket.on("initiate_call", ({ callerId, receiverId, callType, callerInfo }) => {
      console.log(`Call initiated from ${callerId} to ${receiverId}`);
      emitToAppOnly(io, receiverId, "incoming_call", {
        callerId,
        callerName: callerInfo.userName,
        callerAvatar: callerInfo.profilePicture,
        callType,
        callId: `${callerId}-${receiverId}-${Date.now()}`
      });
    });

    // 2. Accept Call
    socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
      console.log(`Call ${callId} accepted by ${receiverInfo.fullName}`);
      emitToAppOnly(io, callerId, "call_accepted", {
        receiverName: receiverInfo.fullName,
        callId
      });
    });

    // 3. Reject Call
    socket.on("reject_call", ({ callerId, callId }) => {
      console.log(`Call ${callId} rejected`);
      emitToAppOnly(io, callerId, "call_rejected", { callId });
    });

    // 4. End Call
    socket.on("end_call", ({ participantId, callId }) => {
      console.log(`Call ${callId} ended`);
      emitToAppOnly(io, participantId, "call_ended", { callId });
    });

    // 5. WebRTC Offer
    socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
      console.log(`WebRTC offer sent to ${receiverId}`);
      emitToAppOnly(io, receiverId, "webrtc_offer", {
        offer,
        senderId: userId, // Current user is sender
        callId
      });
    });

    // 6. WebRTC Answer
    socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
      console.log(`WebRTC answer sent to ${receiverId}`);
      emitToAppOnly(io, receiverId, "webrtc_answer", {
        answer,
        senderId: userId,
        callId
      });
    });

    // 7. WebRTC ICE Candidate
    socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
      emitToAppOnly(io, receiverId, "webrtc_ice_candidate", {
        candidate,
        senderId: userId,
        callId
      });
    });

    // 8. Toggle Media (Video/Audio)
    socket.on("toggle_media", ({ receiverId, callId, isVideoEnabled, isAudioEnabled }) => {
      emitToAppOnly(io, receiverId, "media_toggled", {
        callId,
        isVideoEnabled,
        isAudioEnabled
      });
    });
  });

  // attaching the online user map to the socket server for external use

  io.socketUserMap = onlineUsers;

  return io;
};
