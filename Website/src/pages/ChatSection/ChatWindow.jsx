import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../Store/useThemeStore";
import useUserStore from "../../Store/useUserStore";
import { useChatStore } from "../../Store/useChatStore";
import { isToday, isYesterday, format } from "date-fns";
import ChatRightPhoto from "../../assets/Chat_Right_Photo.png";
import EmojiPicker from "emoji-picker-react";
import {
  FaArrowLeft,
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
import { SmilePlus, Trash2, UserX, AlertTriangle, MoreVertical, CheckCircle, User, MessageSquareDashed } from "lucide-react";
import { IoMdSend } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "../../Services/ChatServices";
import VideoCallManager from "../VideoCall/VideoCallManager";
import useCallStore from "../../Store/useCallStore";
import {
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES,
  formatFileSize,
  validateFile,
} from "../../Utils/FileConfig";
import { toast } from "sonner"

// ─── ImageEditor import (same folder mein honi chahiye) ───────────
import ImageEditor from "../../components/ImageEditor";
import useOutsideClick from "../../hooks/useOutsideClick";

// ================================================================
//  Helper Functions
// ================================================================

const isValidate = (date) => date instanceof Date && !isNaN(date);

const formatLastSeenTime = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (!isValidate(date)) return "";
  const timeStr = format(date, "HH:mm");
  if (isToday(date))     return `today at ${timeStr}`;
  if (isYesterday(date)) return `yesterday at ${timeStr}`;
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < 7
    ? `${format(date, "EEEE")} at ${timeStr}`
    : `${format(date, "d MMM")} at ${timeStr}`;
};

// ================================================================
//  ChatWindow Component
// ================================================================

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage]           = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu]   = useState(false);

  // ── File / Image State ──
  const [filePreview, setFilePreview]   = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // ── Image Editor State ──
  // showEditor    → true hone pe ImageEditor full-screen modal khulega
  // editorImage   → Object URL jo editor ko bhejte hain (original selected image)
  const [showEditor, setShowEditor]     = useState(false);
  const [editorImage, setEditorImage]   = useState(null);

  // Action Modal
  const [isActionOpen, setIsActionOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
  const [isClearing, setIsClearing] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messageEndRef    = useRef(null);
  const emojiPickerRef   = useRef(null);
  const fileInputRef     = useRef(null);
  const actionMenuRef    = useRef(null);
  const fileMenuRef      = useRef(null);

  const { user } = useUserStore();

  const {
    messages, loading, sendMessage, receiveMessage,
    fetchMessages, fetchConversations, conversations,
    setCurrentConversation, isUserTyping, startTyping, stopTyping,
    getUserLastSeen, isUserOnline, cleanUp, resetChatState,
    addReactions, deleteMessage, clearChat,
    blockStatus, checkBlockStatus, blockUser, unblockUser,
    setSelectedContactId
  } = useChatStore();

  const { initiateCall } = useCallStore();


  // ── Online / Last Seen ──
  const receiverId  = selectedContact?.user?._id || selectedContact?._id;
  const storeOnline = isUserOnline(receiverId);
  const online      = useChatStore.getState().onlineUsers.has(receiverId)
    ? storeOnline
    : selectedContact?.user?.isOnline;
  const storeLastSeen = getUserLastSeen(receiverId);
  const lastSeen      = storeLastSeen || selectedContact?.user?.lastSeen;
  const isTyping      = isUserTyping(receiverId);

  const otherUser = selectedContact?.user;
  const savedName = user?.contactMappings?.[otherUser?.phoneNumber];
  const displayName = savedName || otherUser?.fullName || selectedContact?.fullName || otherUser?.phoneNumber || "Unknown User";

  useEffect(() => {
    const convId = selectedContact?.conversationId || selectedContact?.conversation?._id;
    if (convId) {
      setCurrentConversation(convId);
      fetchMessages(convId);
      
      // Check block status
      const otherUserId = selectedContact?.user?._id || selectedContact?._id;
      if (otherUserId) {
        setSelectedContactId(otherUserId);
        checkBlockStatus(otherUserId);
      }
    }
  }, [selectedContact, setCurrentConversation]);

  useEffect(() => {
    return () => { resetChatState(); };
  }, []);

  // ── Outside Click Handlers ──
  useOutsideClick(actionMenuRef, () => setIsActionOpen(false));
  useOutsideClick(fileMenuRef,   () => setShowFileMenu(false));
  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));

  const scrollToBottom = () => messageEndRef.current?.scrollIntoView({ behaviour: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Typing indicator ──
  useEffect(() => {
    if (message && selectedContact) {
      startTyping(receiverId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(receiverId), 2000);
    }
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, [message, selectedContact, startTyping, stopTyping]);


  // ================================================================
  //  handleFileChange
  //  File select hone par:
  //    - Agar IMAGE hai → ImageEditor kholo
  //    - Agar VIDEO/other hai → seedha preview dikhao (editor nahi)
  // ================================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    setShowFileMenu(false);
    e.target.value = ""; // Same file dobara select kar sake

    if (file.type.startsWith("image/")) {
      // ── Image → Editor mein bhejo ──
      const objectURL = URL.createObjectURL(file);
      setEditorImage(objectURL);   // Editor ko original image do
      setSelectedFile(file);       // File reference save rakho (size/name ke liye)
      setShowEditor(true);         // Editor modal kholo
    } else {
      // ── Video / other → seedha preview ──
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };


  // ================================================================
  //  handleEditorDone
  //  ImageEditor "Done" dabane pe dataURL aata hai
  //  Usse File/Blob mein convert karo aur chat ke liye ready karo
  // ================================================================
  const handleEditorDone = async (dataURL) => {
    try {
      // dataURL → Blob → File
      const res  = await fetch(dataURL);
      const blob = await res.blob();
      const editedFile = new File([blob], "edited-image.png", { type: "image/png" });

      setSelectedFile(editedFile);   // Yahi file send hogi
      setFilePreview(dataURL);       // Preview mein edited image dikhao
      setShowEditor(false);          // Editor band karo
      setEditorImage(null);          // Cleanup
    } catch (err) {
      console.error("Editor done error:", err);
      toast.error("Image process karne mein error aaya");
    }
  };


  // ================================================================
  //  handleEditorCancel
  //  User ne editor close kar diya — sab reset karo
  // ================================================================
  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditorImage(null);
    setSelectedFile(null);
    setFilePreview(null);
  };


  // ── Send Message ──
  const handleSendMessage = async () => {
    if (!selectedContact || !user?._id) return;
    if (!message.trim() && !selectedFile) return;

    try {
      const formData   = new FormData();
      const receiverId = selectedContact?.user?._id || selectedContact?._id;
      if (!receiverId || receiverId === "undefined") return;

      formData.append("senderId", user?._id);
      formData.append("receiverId", receiverId);

      const convId = selectedContact?.conversationId || selectedContact?.conversation?._id;
      if (convId) formData.append("conversationId", convId);
      if (message.trim()) formData.append("content", message.trim());
      if (selectedFile)   formData.append("media", selectedFile);

      await sendMessage(formData);
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      setEditorImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Frontend Error:", error);
    }
  };


  // ── Date Separator ──
  const renderDateSeparator = (date) => {
    if (!isValidate(date)) return null;
    const dateString = isToday(date)
      ? "Today" : isYesterday(date)
      ? "Yesterday" : format(date, "EEEE, MMMM d");
    return (
      <div className="my-4 flex justify-center">
        <span className="rounded-full border border-blue-900/30 bg-[#06234f]/60 px-4 py-1.5 text-xs font-medium text-blue-300/60">
          {dateString}
        </span>
      </div>
    );
  };

  // ── Group messages by date ──
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, msg) => {
        if (!msg.createdAt) return acc;
        const date = new Date(msg.createdAt);
        if (isValidate(date)) {
          const key = format(date, "yyyy-MM-dd");
          if (!acc[key]) acc[key] = [];
          acc[key].push(msg);
        }
        return acc;
      }, {})
    : {};

  const handleVideoCall = () => {
    toast("Please use Tether Mobile App for video and voice calls.", {
      position: "top-right",
      autoClose: 3000,
      theme: "dark"
    });
  };

  const handleReaction = (messageId, emoji) => addReactions(messageId, emoji);


  // ── Empty state ──
  if (!selectedContact) {
    return (
      <div className="relative flex h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-[#020818] text-center">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="z-10 flex max-w-md flex-col items-center px-6">
          <div className="group relative">
            <div className="absolute -inset-1 rounded-full bg-linear-to-r from-[#60a5fa] to-[#a78bfa] opacity-10 blur transition duration-1000 group-hover:opacity-20" />
            <img src={ChatRightPhoto} className="mb-8 h-auto w-100 opacity-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" alt="Welcome" />
          </div>
          <h2 className="mb-3 bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Welcome to Tether
          </h2>
          <p className="text-lg leading-relaxed font-light text-blue-300/50">
            Select a contact from the list to <br /> start a secure conversation.
          </p>
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
 
  return (
    <>
      <div className="flex h-screen w-full flex-1 flex-col bg-[#020818]">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-blue-900/30 bg-[#020818] px-4 py-2.75 shadow-[0_4px_24px_rgba(0,0,255,0.08)]">
          <button
            onClick={() => { setSelectedContact(null); setCurrentConversation(null); }}
            className="cursor-pointer rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-900/30"
          >
            <FaArrowLeft size={19} />
          </button>

          {selectedContact?.user?.profilePicture ? (
            <img
              src={selectedContact.user.profilePicture}
              className="h-10 w-10 shrink-0 rounded-full border border-blue-500/20 object-cover"
              alt="profile"
            />
          ) : displayName ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
              <span className="text-sm font-semibold text-blue-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
              <User size={20} className="text-blue-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] leading-tight font-semibold text-blue-50">
              {displayName}
            </h2>
            <p className="mt-0.5 text-[12px] leading-tight">
              {isTyping ? (
                <span className="text-green-400">Typing...</span>
              ) : online ? (
                <span className="text-green-400">Online</span>
              ) : lastSeen ? (
                <span className="text-blue-300/50">Last seen {formatLastSeenTime(lastSeen)}</span>
              ) : (
                <span className="text-blue-300/50">Offline</span>
              )}
            </p>
          </div>

         {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleVideoCall}
              disabled={!blockStatus.canMessage}
              title={!blockStatus.canMessage ? "Calls disabled" : (online ? "Start Video Call" : "User is offline")}
              className={`cursor-pointer rounded-full p-2 transition-colors ${!blockStatus.canMessage ? 'text-gray-500' : 'text-blue-400 hover:bg-blue-900/30'}`}
            >
              <FaVideo size={17} />
            </button>
            <div ref={actionMenuRef} className="relative">
              <button
                onClick={() => setIsActionOpen(!isActionOpen)}
                className="relative cursor-pointer rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-900/30"
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {isActionOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-blue-900/40 bg-[#06234f] p-1 shadow-2xl backdrop-blur-xl"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ open: true, type: "clear" });
                        setIsActionOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-200 transition-colors cursor-pointer hover:bg-blue-800/40"
                    >
                      <Trash2 size={16} className="text-blue-400" />
                      Clear Chat
                    </button>
                    <div className="mx-2 border-t border-blue-900/30" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const otherUserId = selectedContact?.user?._id || selectedContact?._id;
                        if (blockStatus.isBlockedByMe) {
                          unblockUser(otherUserId);
                        } else {
                          setConfirmModal({ open: true, type: "block" });
                        }
                        setIsActionOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${blockStatus.isBlockedByMe ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                    >
                      {blockStatus.isBlockedByMe ? (
                        <>
                          <CheckCircle size={16} className="text-green-400" />
                          Unblock User
                        </>
                      ) : (
                        <>
                          <UserX size={16} className="text-red-400" />
                          Block User
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div
          className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-3 flex flex-col"
          style={{ background: "radial-gradient(ellipse at top, #040f2e 0%, #020818 70%)" }}
        >
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-blue-500/5 p-8 mb-4">
                <MessageSquareDashed size={60} className="text-blue-500/20" />
              </div>
              <h3 className="text-xl font-bold text-blue-100">No messages yet</h3>
              <p className="mt-2 text-sm text-blue-300/40">
                Send a message to start the conversation with {displayName}
              </p>
            </div>
          ) : (
            <>
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <React.Fragment key={date}>
                  {renderDateSeparator(new Date(date))}
                  {msgs
                    .filter(msg => {
                      const msgConvId     = msg.conversation?._id?.toString() || msg.conversation?.toString();
                      const currentConvId = selectedContact?.conversationId?.toString() || selectedContact?.conversation?._id?.toString();
                      return msgConvId === currentConvId;
                    })
                    .map(msg => (
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
            </>
          )}
        </div>

        {/* ── File Preview (video ya edited image) ── */}
        {filePreview && (
          <div className="relative border-t border-blue-900/30 bg-[#020818] px-4 py-2">
            <div className="relative mx-auto w-fit">
              {selectedFile?.type.startsWith("video/") ? (
                <video src={filePreview} controls className="mx-auto w-80 rounded object-cover shadow-lg" />
              ) : (
                <img src={filePreview} className="max-h-40 max-w-xs rounded-xl border border-blue-500/20 object-cover" alt="preview" />
              )}

              {/* File info */}
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#06234f]/60 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-lg">
                    {selectedFile?.type.startsWith("video/") ? "🎥" : "🖼️"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-blue-200">{selectedFile?.name}</p>
                    <p className="text-[10px] text-gray-400">{formatFileSize(selectedFile?.size)}</p>
                  </div>
                </div>

                {/* ── Edit button: sirf images ke liye ── */}
                {!selectedFile?.type.startsWith("video/") && (
                  <button
                    onClick={() => {
                      setEditorImage(filePreview);
                      setShowEditor(true);
                    }}
                    className="shrink-0 rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-[11px] font-semibold text-blue-300 transition-colors hover:bg-blue-600/40"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => {
                  setFilePreview(null);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
              >
                <FaTimes size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Blocked banner (WhatsApp style) */}
        {!blockStatus.canMessage && (
          <div className="mx-auto my-2 w-fit rounded-lg bg-blue-900/20 px-4 py-1.5 text-center backdrop-blur-sm border border-blue-500/10">
            <p className="text-[12px] text-blue-300/70">
              {blockStatus.isBlockedByMe ? (
                <>
                  You blocked this contact.{" "}
                  <button 
                    onClick={() => unblockUser(selectedContact?.user?._id || selectedContact?._id)}
                    className="font-semibold text-blue-400 hover:underline cursor-pointer"
                  >
                    Tap to unblock
                  </button>
                </>
              ) : (
                "You can no longer message this contact."
              )}
            </p>
          </div>
        )}

        {/* ── Bottom Bar ── */}
        <div className={`relative mx-auto mb-3 flex w-[95%] items-center rounded-full border border-blue-900/20 bg-[#0a1a3a] px-4 py-0.5 shadow-none transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.4)] focus-within:ring-1 focus-within:ring-blue-500 hover:-translate-y-0.5 hover:shadow-[0_5px_25px_rgba(37,99,235,0.4)] ${!blockStatus.canMessage ? 'opacity-50 pointer-events-none' : ''}`}>

          {/* Attachment button */}
          <div ref={fileMenuRef} className="relative shrink-0">
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
                    if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); }
                    setShowFileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-blue-200 transition-colors cursor-pointer hover:bg-blue-800/40"
                >
                  <FaImage size={14} className="text-blue-400" />
                  Image / Video
                </button>
                <div className="border-t border-blue-900/30" />
                <button
                  onClick={() => { fileInputRef.current.click(); setShowFileMenu(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-blue-200 transition-colors cursor-pointer hover:bg-blue-800/40"
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

          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50">
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setMessage(prev => prev + emojiObject.emoji);
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
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (!message.trim() && !selectedFile) { toast.warn("Khali message send nahi ho sakta!"); return; }
                handleSendMessage();
              }
            }}
            placeholder={blockStatus.isBlockedByMe ? "Unblock to send a message" : (blockStatus.isBlockedByThem ? "You are blocked" : "Type a message")}
            disabled={!blockStatus.canMessage}
            className="min-w-0 flex-1 rounded-full bg-transparent px-2 py-2.5 text-[14px] text-white transition-all outline-none placeholder:text-blue-400 sm:px-4 disabled:cursor-not-allowed"
          />

          {/* Send button */}
          <button
            onClick={() => {
              if (!message.trim() && !selectedFile) {
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

      {/* ── ImageEditor Modal ─────────────────────────────────────────
           showEditor true hone par poora screen cover kar leta hai
           onDone  → edited dataURL milta hai → File mein convert karo
           onCancel → editor band karo, selection clear karo
      ────────────────────────────────────────────────────────────── */}
      {showEditor && (
        <ImageEditor
          initialImage={editorImage}
          onDone={handleEditorDone}
          onCancel={handleEditorCancel}
        />
      )}

      <VideoCallManager socket={getSocket()} />

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ open: false, type: null })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-blue-500/20 bg-[#061838] p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${confirmModal.type === 'block' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {confirmModal.type === 'block' ? <AlertTriangle size={32} /> : <Trash2 size={32} />}
                </div>
                
                <h3 className="mb-2 text-xl font-bold text-white">
                  {confirmModal.type === 'block' ? 'Block this User?' : 'Clear Conversation?'}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-blue-200/60">
                  {confirmModal.type === 'block' 
                    ? "Are you sure you want to block this user? You won't be able to send or receive messages from them."
                    : "This will permanently delete all messages in this chat for you. This action cannot be undone."}
                </p>

                <div className="flex w-full gap-3">
                  <button
                    disabled={isClearing}
                    onClick={() => setConfirmModal({ open: false, type: null })}
                    className="flex-1 cursor-pointer rounded-xl border border-blue-900/40 py-2.5 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-900/30 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isClearing}
                    onClick={async () => {
                      if (confirmModal.type === 'clear') {
                        setIsClearing(true);
                        const convId = selectedContact?.conversationId || selectedContact?.conversation?._id;
                        const success = await clearChat(convId);
                        setIsClearing(false);
                        if (success) {
                          setConfirmModal({ open: false, type: null });
                          toast.success("Chat cleared successfully");
                        } else {
                          toast.error("Failed to clear chat");
                        }
                      } else {
                        setIsClearing(true);
                        try {
                          const otherUserId = selectedContact?.user?._id || selectedContact?._id;
                          await blockUser(otherUserId);
                          setConfirmModal({ open: false, type: null });
                          toast.success("User blocked successfully");
                        } catch (err) {
                          toast.error("Failed to block user");
                        } finally {
                          setIsClearing(false);
                        }
                      }
                    }}
                    className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg flex items-center justify-center gap-2 ${confirmModal.type === 'block' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-70`}
                  >
                    {isClearing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Clearing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWindow;