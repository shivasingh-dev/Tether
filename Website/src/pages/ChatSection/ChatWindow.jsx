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
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  useEffect(() => {
    const convId = selectedContact?.conversationId || selectedContact?.conversation?._id;
    if (convId) {
      setCurrentConversation(convId);
      console.log("Conversation id set to", convId)
      fetchMessages(convId);
    }
  }, [selectedContact, setCurrentConversation]);

  useEffect(() => {;
    initSocketListeners();
    return () => {  
    set({ messages: [], currentConversation: null });
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
      startTyping(selectedContact?._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id);
      }, 2000);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !user?._id) {
      console.error('Sender or Contact missing')
      return
    };

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
      <div className="flex justify-center my-4">
        <span className="px-4 py-1.5 rounded-full text-xs font-medium text-blue-300/60 bg-[#06234f]/60 border border-blue-900/30">
          {dateString}
        </span>
      </div>
    );
  };

  // Group message
  const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, message) => {
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#020818] h-screen text-center relative overflow-hidden">
        {/* Background Decor - Subtle Glow to match the theme */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md z-10 flex flex-col items-center px-6">
          {/* Illustration Container */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-[#60a5fa] to-[#a78bfa] rounded-full blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <img
              src={ChatRightPhoto}
              className="w-100 h-auto mb-8 opacity-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              alt="Welcome"
            />
          </div>

          {/* Heading with Brand Gradient */}
          <h2 className="text-4xl font-bold bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent tracking-tight mb-3">
            Welcome to Tether
          </h2>

          {/* Subtext with better color matching */}
          <p className="text-blue-300/50 text-lg font-light leading-relaxed">
            Select a contact from the list to <br />
            start a secure conversation.
          </p>

          {/* Encryption Badge - Styled to look like a chip */}
          <div className="mt-7 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
            <FaLock className="text-blue-400/40 text-xs" />
            <span className="text-xs text-blue-400/40 uppercase tracking-widest font-semibold">
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen w-full flex flex-col bg-[#020818]" >

      {/*  Header  */}
      <div className="px-4 py-2.75 bg-[#020818]  border-blue-900/30 flex items-center gap-3 shadow-[0_4px_24px_rgba(0,0,255,0.08)]">
        {/* Back button */}
        <button
          onClick={() => {
            setSelectedContact(null)
            setCurrentConversation(null)
          }}
          className="p-2 rounded-full text-blue-400 hover:bg-blue-900/30 transition-colors cursor-pointer"
        >
          <FaArrowLeft size={19} />
        </button>

        {/* Avatar */}
        {selectedContact?.user?.profilePicture ? (
          <img
            src={selectedContact.user.profilePicture}
            className="w-10 h-10 rounded-full object-cover border border-blue-500/20 shrink-0"
            alt="profile"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#06234f] border border-blue-500/20 flex items-center justify-center shrink-0">
            <span className="text-blue-400 text-sm font-semibold">
              {(selectedContact?.user?.fullName ||
                selectedContact?.fullName ||
                "?")[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Profile */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-blue-50 truncate leading-tight">
            {selectedContact?.user?.fullName || selectedContact?.fullName}
          </h2>
          <p className="text-[12px] leading-tight mt-0.5">
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
          <button className="p-2 rounded-full text-blue-400 hover:bg-blue-900/30 transition-colors cursor-pointer">
            <FaVideo size={17} />
          </button>
          <button className="p-2 rounded-full text-blue-400 hover:bg-blue-900/30 transition-colors cursor-pointer">
            <FaEllipsisV size={16} />
          </button>
        </div>
      </div>

      {/*  Messages Area */}
      <div
        className="flex-1 overflow-y-auto sidebar-scrollbar px-4 py-3 space-y-1"
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
        <div className="relative px-4 py-2 bg-[#020818] border-t border-blue-900/30">
          <div className="relative w-fit mx-auto">
            {selectedFile?.type.startsWith("video/") ? (
              <video 
                src={filePreview}
                controls
                className="w-80 object-cover rounded shadow-lg mx-auto"
              />
            ) : (
              <img
              src={filePreview}
              className="max-h-40 max-w-xs object-cover rounded-xl border border-blue-500/20"
              alt="preview"
            />
            )}
            <button
              onClick={() => {
                setFilePreview(null);
                setSelectedFile(null);
              }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            >
              <FaTimes size={10} />
            </button>
          </div>
        </div>
      )}

      {/*  Bottom Bar  */}
      <div
        className="
        px-4 py-0.5 mb-3 flex items-center relative
        bg-[#0a1a3a] transition-all duration-300
        border rounded-full w-[95%] mx-auto border-blue-900/20
        shadow-none hover:shadow-[0_5px_25px_rgba(37,99,235,0.4)]
        hover:-translate-y-0.5 focus-within:border-blue-400 
        focus-within:ring-1 focus-within:ring-blue-500 
        focus-within:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
      >
        {/* Attachment button + menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="p-2 rounded-full text-blue-400/70 hover:text-blue-300 hover:bg-blue-900/30 transition-colors cursor-pointer"
          >
            <FaPaperclip size={19} />
          </button>

          {showFileMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#06234f] border border-blue-900/40 rounded-xl shadow-xl overflow-hidden min-w-40">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                onClick={() => {
                  fileInputRef.current.click();
                  setShowFileMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-blue-200 hover:bg-blue-800/40 transition-colors"
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
                className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-blue-200 hover:bg-blue-800/40 transition-colors"
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
          className="p-2 rounded-full text-blue-400/70 hover:text-blue-300 hover:bg-blue-900/30 transition-colors cursor-pointer shrink-0"
        >
          <SmilePlus size={19} />
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute left-4 bottom-16 z-50">
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
            if (e.key === 'Enter' && message.trim()) {
              handleSendMessage()
            }
          }}
          placeholder="Type a message"
          className="flex-1 px-2 py-2.5 rounded-full 
          min-w-0 sm:px-4
          text-white text-[14px] 
          placeholder:text-blue-400
          outline-none transition-all "
        />

        {/* Send button */}
        <button
          disabled={!message.trim()}
          onClick={handleSendMessage}
          className={`
          p-2 rounded-full transition-all shrink-0
          ${!message.trim()
              ? "bg-gray-600/50 cursor-not-allowed opacity-50"
              : "bg-blue-600 hover:bg-blue-500 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            }`}
        >
          <IoMdSend size={17} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
