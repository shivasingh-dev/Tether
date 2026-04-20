import React, { useEffect, useMemo, useRef } from "react";
import useCallStore from "../../Store/useCallStore";
import useUserStore from "../../Store/useUserStore";
import useThemeStore from "../../Store/useThemeStore";
import {FaPhoneSlash} from 'react-icons/fa'

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
    if (peerConnection && remoteSteam) {
      setCallStatus("connected");
      setCallActive(true);
      console.log("both peer connection & remote stream is available");
    }
  }, [peerConnection, remoteSteam, setCallStatus, setCallActive]);

  // set up local video stream when local stream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up the remote video stream when remote stream changes
  useEffect(() => {
    if (remoteSteam && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteSteam;
    }
  }, [remoteSteam]);

  // Initalize media stream
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      setLocalStream(stream);
      console.log("Local Media stream", stream.getTracks());
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
      createPeerConnection(stream, "RECEIVER");

      socket.emit("accept_call", {
        callerId: incomingCall?.callId,
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
            await peerConnection.addIceCandidate(new RTCIceCandidate());
            console.loog("Ice candidate added");
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

    console.log("socket listeners registered");
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
    <div className="bg-opacity-75 fixed inset-0 flex items-center justify-center bg-black">
      <div
        className={`max-h-3xl relative h-full w-full max-w-4xl overflow-hidden rounded-lg ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}
      >
        {incomingCall && !isCallActive (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="mb-8 text-center">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                <img src={displayInfo?.avatar} alt={displayInfo?.name} className="h-full w-full object-cover" />
              </div>
              <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? "text-white": "text-gray-900"}`}>
                {displayInfo?.name}
              </h2>
              <p className={`text-lg ${theme === 'dark' ? "text-gray-300" : "text-gray-600"}`}>
                Incoming {callType} call...
              </p>
            </div>
            <div className="flex space-x-6">
              <button onClick={handleRejectCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors">
                <FaPhoneSlash className="w-6 h-6" />
              </button>

              <button onClick={handleAnswerCall} className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors">
                <FaPhoneSlash className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Active call ui */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full">
            {callType === 'video' && (
              <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover bg-gray-600 ${remoteSteam ? "block" : "hidden"}`} />
            )}
          </div>
        )}

        {/* Avatar / status display */}
      </div>
    </div>
  );
};

export default VideoCallModal;
