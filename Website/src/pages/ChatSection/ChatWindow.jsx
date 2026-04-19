import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../Store/useThemeStore";
import useUserStore from "../../Store/useUserStore";
import { useChatStore } from "../../Store/useChatStore";
import { isToday, isYesterday, format, add, formatDate } from "date-fns";
import ChatRightPhoto from "../../assets/Chat_Right_Photo.png";
import EmojiPicker from "emoji-picker-react";
import {
  FaArrowLeft,
  FaEllipsisH,
  FaEllipsisV,
  FaFile,
  FaImage,
  FaLock,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import { SmilePlus } from "lucide-react";
import { IoMdSend } from "react-icons/io";
import { getSocket } from "../../Services/ChatServices";
import VideoCallManager from "../VideoCall/VideoCallManager";
import useCallStore from "../../Store/useCallStore";
import {
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES,
  formatFileSize,
  validateFile,
} from "../../Utils/FileConfig";
import { toast } from "react-toastify";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useUserStore();
  const { socket } = getSocket();

  const {
    messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    setCurrentConversation,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    cleanUp,
    resetChatState,
    addReactions,
    deleteMessage,
    initSocketListeners,
  } = useChatStore();

  // get online status and last seen
  const receiverId = selectedContact?.user?._id || selectedContact?._id;
  const storeOnline = isUserOnline(receiverId);
  const online = useChatStore.getState().onlineUsers.has(receiverId)
    ? storeOnline
    : selectedContact?.user?.isOnline;

  const storeLastSeen = getUserLastSeen(receiverId);
  const lastSeen = storeLastSeen || selectedContact?.user?.lastSeen;

  const isTyping = isUserTyping(receiverId);

  useEffect(() => {
    const convId =
      selectedContact?.conversationId || selectedContact?.conversation?._id;
    if (convId) {
      setCurrentConversation(convId);
      fetchMessages(convId);
    }
  }, [selectedContact, setCurrentConversation]);

  useEffect(() => {
    initSocketListeners();
    return () => {
      resetChatState();
    };
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behaviour: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(receiverId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(receiverId);
      }, 2000);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file
    const validation = validateFile(file);

    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = ""; // Reset input
      return;
    }

    // File is valid
    setSelectedFile(file);
    setShowFileMenu(false);
    setFilePreview(URL.createObjectURL(file));

    // Reset for selecting same file again
    e.target.value = "";
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !user?._id) {
      console.error("Sender or Contact missing");
      return;
    }

    if (!message.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      const receiverId = selectedContact?.user?._id || selectedContact?._id;

      if (!receiverId || receiverId === "undefined") {
        console.error("Receiver ID missing!");
        return;
      }
      formData.append("receiverId", receiverId);

      const convId =
        selectedContact?.conversationId || selectedContact?.conversation?._id;
      if (convId) {
        formData.append("conversationId", convId);
      }

      if (message.trim()) formData.append("content", message.trim());
      if (selectedFile) formData.append("media", selectedFile);

      await sendMessage(formData);
      setMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Frontend Error:", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) return null;

    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "EEEE, MMMM d");
    }

    return (
      <div className="my-4 flex justify-center">
        <span className="rounded-full border border-blue-900/30 bg-[#06234f]/60 px-4 py-1.5 text-xs font-medium text-blue-300/60">
          {dateString}
        </span>
      </div>
    );
  };

  // Group message
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if (isValidate(date)) {
          const dateString = format(date, "yyyy-MM-dd");
          if (!acc[dateString]) {
            acc[dateString] = [];
          }
          acc[dateString].push(message);
        } else {
          console.error("Invalid date for message", message);
        }
        return acc;
      }, {})
    : {};

  const handleReaction = (messageId, emoji) => {
    addReactions(messageId, emoji);
  };

  if (!selectedContact) {
    return (
      <div className="relative flex h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-[#020818] text-center">
        {/* Background Decor - Subtle Glow to match the theme */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[120px]" />

        <div className="z-10 flex max-w-md flex-col items-center px-6">
          {/* Illustration Container */}
          <div className="group relative">
            <div className="absolute -inset-1 rounded-full bg-linear-to-r from-[#60a5fa] to-[#a78bfa] opacity-10 blur transition duration-1000 group-hover:opacity-20"></div>
            <img
              src={ChatRightPhoto}
              className="mb-8 h-auto w-100 opacity-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              alt="Welcome"
            />
          </div>

          {/* Heading with Brand Gradient */}
          <h2 className="mb-3 bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Welcome to Tether
          </h2>

          {/* Subtext with better color matching */}
          <p className="text-lg leading-relaxed font-light text-blue-300/50">
            Select a contact from the list to <br />
            start a secure conversation.
          </p>

          {/* Encryption Badge - Styled to look like a chip */}
          <div className="mt-7 flex items-center gap-2 rounded-full border border-blue-500/10 bg-blue-500/5 px-4 py-2 backdrop-blur-sm">
            <FaLock className="text-xs text-blue-400/40" />
            <span className="text-xs font-semibold tracking-widest text-blue-400/40 uppercase">
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleVideoCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useCallStore.getState();

      const avatar = selectedContact?.profilePicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.fullName,
        avatar,
        "video",
      );
    } else {
      alert("User is offline, can not initiate the call");
    }
  };

  return (
    <>
      <div className="flex h-screen w-full flex-1 flex-col bg-[#020818]">
        {/*  Header  */}
        <div className="flex items-center gap-3 border-blue-900/30 bg-[#020818] px-4 py-2.75 shadow-[0_4px_24px_rgba(0,0,255,0.08)]">
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedContact(null);
              setCurrentConversation(null);
            }}
            className="cursor-pointer rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-900/30"
          >
            <FaArrowLeft size={19} />
          </button>

          {/* Avatar */}
          {selectedContact?.user?.profilePicture ? (
            <img
              src={selectedContact.user.profilePicture}
              className="h-10 w-10 shrink-0 rounded-full border border-blue-500/20 object-cover"
              alt="profile"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
              <span className="text-sm font-semibold text-blue-400">
                {(selectedContact?.user?.fullName ||
                  selectedContact?.fullName ||
                  "?")[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Profile */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] leading-tight font-semibold text-blue-50">
              {selectedContact?.user?.fullName || selectedContact?.fullName}
            </h2>
            <p className="mt-0.5 text-[12px] leading-tight">
              {isTyping ? (
                <span className="text-green-400">Typing...</span>
              ) : online ? (
                <span className="text-green-400">Online</span>
              ) : lastSeen ? (
                <span className="text-blue-300/50">
                  Last seen {format(new Date(lastSeen), "HH:mm")}
                </span>
              ) : (
                <span className="text-blue-300/50">Offline</span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleVideoCall}
              title={online ? "Start Video Call" : "User is offline"}
              className="cursor-pointer rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-900/30"
            >
              <FaVideo size={17} />
            </button>
            <button className="cursor-pointer rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-900/30">
              <FaEllipsisV size={16} />
            </button>
          </div>
        </div>

        {/*  Messages Area */}
        <div
          className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-3"
          style={{
            background:
              "radial-gradient(ellipse at top, #040f2e 0%, #020818 70%)",
          }}
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {msgs
                .filter((msg) => {
                  const msgConvId =
                    msg.conversation?._id?.toString() ||
                    msg.conversation?.toString();
                  const currentConvId =
                    selectedContact?.conversationId?.toString() ||
                    selectedContact?.conversation?._id?.toString();
                  return msgConvId === currentConvId;
                })
                .map((msg) => (
                  <MessageBubble
                    key={msg?._id || msg?.tempId}
                    message={msg}
                    currentUser={user}
                    onReact={handleReaction}
                    deleteMessage={deleteMessage}
                  />
                ))}
            </React.Fragment>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/*  File Preview  */}
        {filePreview && (
          <div className="relative border-t border-blue-900/30 bg-[#020818] px-4 py-2">
            <div className="relative mx-auto w-fit">
              {selectedFile?.type.startsWith("video/") ? (
                <video
                  src={filePreview}
                  controls
                  className="mx-auto w-80 rounded object-cover shadow-lg"
                />
              ) : (
                <img
                  src={filePreview}
                  className="max-h-40 max-w-xs rounded-xl border border-blue-500/20 object-cover"
                  alt="preview"
                />
              )}

              {/* File Info - Name & Size */}
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#06234f]/60 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  {selectedFile?.type.startsWith("video/") ? (
                    <span className="text-lg">🎥</span>
                  ) : (
                    <span className="text-lg">🖼️</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs text-blue-200">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatFileSize(selectedFile?.size)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setFilePreview(null);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
              >
                <FaTimes size={10} />
              </button>
            </div>
          </div>
        )}

        {/*  Bottom Bar  */}
        <div className="relative mx-auto mb-3 flex w-[95%] items-center rounded-full border border-blue-900/20 bg-[#0a1a3a] px-4 py-0.5 shadow-none transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.4)] focus-within:ring-1 focus-within:ring-blue-500 hover:-translate-y-0.5 hover:shadow-[0_5px_25px_rgba(37,99,235,0.4)]">
          {/* Attachment button + menu */}
          <div className="relative shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="cursor-pointer rounded-full p-2 text-blue-400/70 transition-colors hover:bg-blue-900/30 hover:text-blue-300"
            >
              <FaPaperclip size={19} />
            </button>

            {showFileMenu && (
              <div className="absolute bottom-full left-0 mb-2 min-w-40 overflow-hidden rounded-xl border border-blue-900/40 bg-[#06234f] shadow-xl">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                      fileInputRef.current.click();
                    }
                    setShowFileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-blue-200 transition-colors hover:bg-blue-800/40"
                >
                  <FaImage size={14} className="text-blue-400" />
                  Image / Video
                </button>
                <div className="border-t border-blue-900/30" />
                <button
                  onClick={() => {
                    fileInputRef.current.click();
                    setShowFileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-blue-200 transition-colors hover:bg-blue-800/40"
                >
                  <FaFile size={13} className="text-blue-400" />
                  Documents
                </button>
              </div>
            )}
          </div>

          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="shrink-0 cursor-pointer rounded-full p-2 text-blue-400/70 transition-colors hover:bg-blue-900/30 hover:text-blue-300"
          >
            <SmilePlus size={19} />
          </button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 left-4 z-50"
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setMessage((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }}
                theme="dark"
              />
            </div>
          )}

          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!message.trim() && !selectedFile) {
                  toast.warn("Khali message send nahi ho sakta!");
                  return;
                }
                handleSendMessage();
              }
            }}
            placeholder="Type a message"
            className="min-w-0 flex-1 rounded-full px-2 py-2.5 text-[14px] text-white transition-all outline-none placeholder:text-blue-400 sm:px-4"
          />

          {/* Send button */}
          <button
            onClick={() => {
              const isMessageEmpty = !message.trim();
              const isFileEmpty = !selectedFile;
              if (isMessageEmpty && isFileEmpty) {
                toast.warn("👀 Blank messages? That's not how this works!");
                return;
              }
              handleSendMessage();
            }}
            className={`shrink-0 rounded-full p-2 transition-all ${
              !message.trim() && !selectedFile
                ? "bg-gray-600/50 opacity-50"
                : "cursor-pointer bg-blue-600 hover:bg-blue-500"
            }`}
          >
            <IoMdSend size={17} className="text-white" />
          </button>
        </div>
      </div>

      <VideoCallManager socket={socket} />
    </>
  );
};

export default ChatWindow;
