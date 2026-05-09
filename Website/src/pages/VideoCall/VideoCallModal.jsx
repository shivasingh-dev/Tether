import React, { useEffect, useMemo, useRef } from "react";
import useCallStore from "../../Store/useCallStore";
import useUserStore from "../../Store/useUserStore";
import useThemeStore from "../../Store/useThemeStore";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhone,
  FaPhoneSlash,
  FaTimes,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    remoteStream,
    isVideoEnabled,
    peerConnection,
    iceCandidatesQueue,
    isCallModalOpen,
    setIncomingCall,
    setCurrentCall,
    callType,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
    callStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidate,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
    isAudioEnabled,
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
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }

    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected");
      setCallActive(true);
      console.log("both peer connection & remote stream is available");
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);

  // set up local video stream when local stream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up the remote video stream when remote stream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initalize media stream
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      setLocalStream(stream);
      console.log("Local Media stream", stream.getTracks());
      return stream;
    } catch (error) {
      console.error("Media Error", error);
    }
  };

  // Create peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // add local tracks immediately
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log(`${role} adding ${track.kind} track`, track.id.slice(0, 8));
      });
    }

    // handle ice candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId =
          currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };

    // handle remote track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`role: ${role} : connection state`, pc.connectionState);
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`${role} : ICE state`, pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`${role} : Signaling state`, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };

  // caller : initialize call after acceptance
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");

      // get media
      const stream = await initializeMedia(callType === "video");

      // create peer connection with offer
      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("Caller Error", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // Receiver: Answer call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");

      // get media
      const stream = await initializeMedia(callType === "video");

      // create peer connection with offer
      const pc = createPeerConnection(stream, "RECEIVER");
      return pc;

      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          fullName: user?.fullName,
          profilePicture: user?.profilePicture,
        },
      });

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver Error", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }

    endCall();
  };

  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;
    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    endCall();
  };

  // socket event listener
  useEffect(() => {
    if (!socket) return;

    // call accepted start caller flow
    const handleCallAccepted = ({ receiverName }) => {
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 500);
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(endCall, 2000);
    };

    const handleCallEnded = () => {
      endCall();
    };

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) return;

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        // process queued ICE candidate
        await processQueuedIceCandidate();

        // create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        });

        console.log("Receiver: Answer send waiting for ice candidates");
      } catch (error) {
        console.error("Receiver error offer", error);
      }
    };

    // Receiver answer (caller)
    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      if (!peerConnection) return;

      if (peerConnection.signalingState === "closed") {
        console.log("Caller: peer connection is closed");
        return;
      }

      try {
        // current caller signing
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        // process queued the ICE candidates
        await processQueuedIceCandidate();

        // check reciever
        const receivers = peerConnection.getReceiver();
        console.log("Receiver", receivers);
      } catch (error) {
        console.error("caller answer error", error);
      }
    };

    // Receiver ICE candidates
    const handleWebRTCIceCandidates = async ({ candidate, senderId }) => {
      if (peerConnection && peerConnection.signalingState !== "closed") {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Ice candidate added");
          } catch (error) {
            console.error("Ice candidate error");
          }
        } else {
          console.log("queuing ice candidates");
          addIceCandidate(candidate);
        }
      }
    };

    // Register all events listener
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

  if (!isCallModalOpen && !incomingCall) return null;

  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div
      className={`relative h-full w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl ${
        theme === "dark"
          ? "bg-linear-to-br from-[#020818] via-[#030f2e] to-[#020818]"
          : "bg-white"
      }`}
    >
      {/* Incoming Call Screen */}
      {incomingCall && !isCallActive && (
        <div className="flex h-full flex-col items-center justify-center p-8">
          <div className="mb-8 text-center">
            {/* Avatar with glow effect */}
            <div className="relative mx-auto mb-6">
              <div
                className={`h-32 w-32 overflow-hidden rounded-full ${
                  theme === "dark"
                    ? "border-4 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                    : "border-4 border-green-500/30 shadow-lg"
                }`}
              >
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className="h-full w-full object-cover"
                  onError={(e) => (e.target.src = "/placeholder.svg")}
                />
              </div>
              {/* Pulsing ring animation */}
              <div
                className={`absolute inset-0 animate-ping rounded-full ${
                  theme === "dark" ? "bg-blue-400/20" : "bg-green-400/20"
                }`}
              />
            </div>

            <h2
              className={`mb-2 text-3xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {displayInfo?.name}
            </h2>
            <p
              className={`text-lg font-medium ${
                theme === "dark" ? "text-blue-300" : "text-green-600"
              }`}
            >
              Incoming {callType} call...
            </p>
          </div>

          {/* Call buttons */}
          <div className="flex gap-8">
            {/* Reject button */}
            <button
              onClick={handleRejectCall}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600 active:scale-95"
            >
              <FaPhoneSlash className="h-7 w-7" />
              <span className="absolute -bottom-8 text-xs font-medium text-gray-400">
                Decline
              </span>
            </button>

            {/* Answer button */}
            <button
              onClick={handleAnswerCall}
              className={`group relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95 ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              <FaPhone className="h-7 w-7" />
              <span className="absolute -bottom-8 text-xs font-medium text-gray-400">
                Accept
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Active Call UI */}
      {shouldShowActiveCall && (
        <div className="relative h-full w-full">
          {/* Remote Video */}
          {callType === "video" && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full bg-gray-900 object-cover ${
                remoteStream ? "block" : "hidden"
              }`}
            />
          )}

          {/* Avatar / Status Display (when no video) */}
          {(!remoteStream || callType !== "video") && (
            <div
              className={`flex h-full w-full items-center justify-center ${
                theme === "dark"
                  ? "bg-linear-to-br from-[#020818] via-[#030f2e] to-[#020818]"
                  : "bg-linear-to-br from-green-50 to-white"
              }`}
            >
              <div className="text-center">
                {/* Avatar */}
                <div
                  className={`mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full ${
                    theme === "dark"
                      ? "border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.4)]"
                      : "border-4 border-green-500/30 shadow-xl"
                  }`}
                >
                  <img
                    src={displayInfo?.avatar}
                    alt={displayInfo?.name}
                    className="h-full w-full object-cover"
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                  />
                </div>

                {/* Name */}
                <p
                  className={`mb-2 text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {displayInfo?.name}
                </p>

                {/* Status */}
                <p
                  className={`text-lg ${
                    theme === "dark" ? "text-blue-300" : "text-green-600"
                  }`}
                >
                  {callStatus === "calling"
                    ? "Calling..."
                    : callStatus === "connecting"
                      ? "Connecting..."
                      : callStatus === "connected"
                        ? "Connected"
                        : callStatus === "failed"
                          ? "Connection failed"
                          : ""}
                </p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {callType === "video" && localStream && (
            <div
              className={`absolute top-6 right-6 h-40 w-32 overflow-hidden rounded-2xl shadow-2xl ${
                theme === "dark"
                  ? "border-2 border-blue-500/30"
                  : "border-2 border-white"
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Call Status Badge */}
          <div className="absolute top-6 left-6">
            <div
              className={`rounded-full px-5 py-2.5 shadow-lg backdrop-blur-md ${
                theme === "dark"
                  ? "bg-[#06234f]/80 border border-blue-500/20"
                  : "bg-white/90 border border-green-200"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-blue-300" : "text-green-600"
                }`}
              >
                {callStatus === "connected" ? "Connected" : callStatus}
              </p>
            </div>
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 transform">
            <div
              className={`flex gap-4 rounded-2xl p-4 backdrop-blur-md ${
                theme === "dark"
                  ? "bg-[#06234f]/80 border border-blue-500/20"
                  : "bg-white/90 shadow-xl"
              }`}
            >
              {/* Video Toggle */}
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                    isVideoEnabled
                      ? theme === "dark"
                        ? "bg-blue-600/30 text-blue-300 hover:bg-blue-600/50"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {isVideoEnabled ? (
                    <FaVideo className="h-5 w-5" />
                  ) : (
                    <FaVideoSlash className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                  isAudioEnabled
                    ? theme === "dark"
                      ? "bg-blue-600/30 text-blue-300 hover:bg-blue-600/50"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {isAudioEnabled ? (
                  <FaMicrophone className="h-5 w-5" />
                ) : (
                  <FaMicrophoneSlash className="h-5 w-5" />
                )}
              </button>

              {/* End Call */}
              <button
                onClick={handleEndCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-600 active:scale-95"
              >
                <FaPhoneSlash className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel button (when calling) */}
      {callStatus === "calling" && (
        <button
          onClick={handleEndCall}
          className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-600 active:scale-95"
        >
          <FaTimes className="h-6 w-6" />
        </button>
      )}
    </div>
  </div>
);
};

export default VideoCallModal;
