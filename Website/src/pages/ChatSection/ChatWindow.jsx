import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../Store/useThemeStore";
import useUserStore from "../../Store/useUserStore";
import { useChatStore } from "../../Store/useChatStore";
import { isToday, isYesterday, format, add } from "date-fns";
import ChatRightPhoto from '../../assets/Chat_Right_Photo.png'
import { FaLock } from "react-icons/fa";
import Card from '../../components/Card'

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

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const {
    messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    cleanUp,
    addReaction,
    deleteMessage,
  } = useChatStore();

  // get online status and last seen
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some(
          (participant) => participant._id === selectedContact?._id,
        ),
      );
      if (conversation._id) {
        fetchMessages(conversation._id);
      }
    }
  }, [selectedContact, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behaviour: "auto" });
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
    const fileChange = e.target.files(0);
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    setFilePreview(null);
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);
      if (message.trim()) {
        formData.append("content", message.trim());
      }

      // if there is file include it too
      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      if (!message.trim() && !selectedFile) return;
      await sendMessage(formData);

      // clear state
      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }
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
        <span
          className={`px-4 py-2 rounded-full ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
        >
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
    addReaction(messageId, emoji)
  }

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

  return <div>Chat Window is here</div>;
};

export default ChatWindow;
