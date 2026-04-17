import React, { useEffect, useMemo, useRef } from "react";
import useCallStore from "../../Store/useCallStore";
import useUserStore from "../../Store/useUserStore";
import useThemeStore from "../../Store/useThemeStore";

const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    remoteSteam,
    isVideoEnabled,
    peerConnection,
    iceCandidatesQueue,
    isCallModalOpen,
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidate,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
  } = useCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const rtcConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
      {
        urls: "stun:stun2.l.google.com:19302",
      },
    ],
  };

  // Memorize display the user info and it is prevent the unneccessary re-rendor
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar
      }
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar
      }
    }

    return null
  }, [incomingCall, currentCall, isCallActive])

  // connection detection
  useEffect(() => {
    if (peerConnection && remoteSteam) {
      setCallStatus("connected")
      setCallActive(true)
      console.log("both peer connection & remote stream is available")
    }
  }, [peerConnection, remoteSteam, setCallStatus, setCallActive])

  // set up local video stream when local stream change

  return <div></div>;
};

export default VideoCallModal;
