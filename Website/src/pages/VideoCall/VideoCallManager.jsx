import React, { useCallback, useEffect } from "react";
import useCallStore from "../../Store/useCallStore";
import VideoCallModal from './VideoCallModal'
import useUserStore from '../../Store/useUserStore'

const VideoCallManager = ({ socket }) => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
  } = useCallStore();

  const { user } = useUserStore();

  useEffect(() => {
    if (!socket) return;

    // handle incoming call
    const handleIncomingCall = ({
      callerId,
      callerName,
      callerAvatar,
      callType,
      callId,
    }) => {
      setIncomingCall({
        callerId,
        callerName,
        callerAvatar,
        callId,
      });

      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("ringing");
    };

    const handleCallEnded = ({ reason }) => {
      setCallStatus("failed");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_failed", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_failed", handleCallEnded);
    };
  }, [
    socket,
    setIncomingCall,
    setCallType,
    setCallModalOpen,
    setCallStatus,
    endCall,
  ]);

  // Memoized function to initiate call
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${user?._id}-${receiverId}-${Date.now()}`;

      const callData = {
        callId,
        participantsId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      };

      setCurrentCall(callData);
      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("calling");

      // Emit the call initiate
      socket.emit("initiate_call", {
        callerId: user?._id,
        receiverId,
        callType,
        callerInfo: {
          userName: user.fullName,
          profilePicture: user.profilePicture,
        },
      });
    },
    [
      user,
      socket,
      setCurrentCall,
      setCallType,
      setCallModalOpen,
      setCallStatus,
    ],
  );

  // expose the initiate call function to store
  useEffect(() => {
    useCallStore.getState().initiateCall = initiateCall;
  }, [initiateCall]);

  return <VideoCallModal socket={socket} />;
};

export default VideoCallManager;
