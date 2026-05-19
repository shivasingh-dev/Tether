const handleVideoCallEvent = (socket, io, onlineUsers) => {
  // Initiate video call
  socket.on("initiate_call", ({ callerId, receiverId, callerInfo }) => {
    const recieverSocketId = onlineUsers.get(receiverId);

    if (recieverSocketId) {
      const callId = `${callerId}-${receiverId}-${Date.now()}`;

      io.to(recieverSocketId).emit("incoming_call", {
        callerId,
        callerName: callerInfo.fullName,
        callerAvatar: callerInfo.profilePicture,
        callId,
        callType,
      });
    } else {
      console.log(`server: Receiver ${receiverId} is offline`);
      socket.emit("call_failed", { reason: "User is Offline" });
    }
  });

  // Accept call
  socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        callerId,
        callerName: receiverInfo.fullName,
        callerAvatar: receiverInfo.profilePicture,
        callId,
      });
    } else {
      console.log(`server: Caller ${callerId} not found`);
    }
  });

  // Reject call
  socket.on("reject_call", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", { callId });
    }
  });

  // End Call
  socket.on("end_call", ({ callId, participantId }) => {
    const participantSocketId = onlineUsers.get(participantId);

    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", { callId });
    }
  });

  // Web RTC signaling event with proper userId
  socket.on("webrtc_offer", ({offer, receiverId, callId}) => {
    const recieverSocketId = onlineUsers.get(receiverId)

    if (recieverSocketId) {
      io.to(recieverSocketId).emit("webrtc_offer", {
        offer,
        senderId: socket.userId,
        callId
      })
       console.log(`server offer forwarded to ${receiverId}`)
    } else {
      console.log(`server: Receiver ${receiverId} not found the offer`)
    }
  })

  // Web RTC signaling event with proper userId
  socket.on("webrtc_answer", ({answer, receiverId, callId}) => {
    const recieverSocketId = onlineUsers.get(receiverId)

    if (recieverSocketId) {
      io.to(recieverSocketId).emit("webrtc_answer", {
        answer,
        senderId: socket.userId,
        callId
      })
      console.log(`server answer forwarded to ${receiverId}`)
    } else {
      console.log(`server: Receiver ${receiverId} not found the answer`)
    }
  })

   // Web RTC signaling event with proper userId
  socket.on("webrtc_ice_candidate", ({candidate, receiverId, callId}) => {
    const recieverSocketId = onlineUsers.get(receiverId)

    if (recieverSocketId) {
      io.to(recieverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        senderId: socket.userId,
        callId
      })
    } else {
      console.log(`server: Receiver ${receiverId} not found for the ICE candidate`)
    }
  })

};


export default handleVideoCallEvent