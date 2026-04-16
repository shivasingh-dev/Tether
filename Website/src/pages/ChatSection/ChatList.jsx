import React, { useState } from "react";
import useLayoutStore from "../../Store/useLayoutStore.js";
import useThemeStore from "../../Store/useThemeStore.js";
import useUserStore from "../../Store/useUserStore.js";
import { FolderPlus, Search, CircleUser } from "lucide-react";
import { motion } from "motion/react";
import formatTimestamp from "../../Utils/formatTime.js";
import { useChatStore } from "../../Store/useChatStore.js";

const ChatList = () => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerms, setSearchTerms] = useState("");

  const { conversations } = useChatStore();
  const convList = Array.isArray(conversations)
    ? conversations
    : conversations?.data || [];
  const contacts = convList.map((conv) => {
    const otherUser = conv.participants?.find((p) => p._id !== user?._id);
    return {
      conversationId: conv._id,
      user: otherUser,
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
    };
  });

  const filteredContacts = contacts?.filter((contact) =>
    contact?.user?.fullName?.toLowerCase().includes(searchTerms.toLowerCase()),
  );

  return (
    <div className={`h-screen w-full border-r border-blue-900/30 bg-[#020818]`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <h2 className="bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-2xl font-black tracking-tight text-transparent">
          Tether
        </h2>
        {/* new chat icon */}
        <button className="relative flex cursor-pointer items-center justify-center rounded-full p-2 text-blue-400 transition-all duration-300 hover:border-blue-400 hover:bg-blue-800 hover:text-blue-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:bg-blue-500/30">
          <FolderPlus size={22} />
        </button>
      </div>

      {/* search bar */}
      <div className="px-4 pt-1 pb-1.5">
        <div className="group relative">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-300"
            size={17}
          />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full rounded-full bg-[#06234f] py-1.5 pr-4 pl-10 text-white transition-all outline-none placeholder:text-blue-300/30 focus:border-blue-400 focus:bg-[#020818] focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:ring-1 focus:ring-blue-500"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>

      {/* recent chats list */}
      <div className="sidebar-scrollbar h-[calc(100vh-140px)] overflow-y-auto">
        {filteredContacts?.map((chat) => {
          const isSelected =
            selectedContact?.conversationId === chat.conversationId;

          return (
            <motion.div
              key={chat.conversationId}
              onClick={() => setSelectedContact(chat)}
              className={`mx-4 my-1 flex cursor-pointer items-center rounded-xl p-2.5 transition-all ${
                isSelected
                  ? "bg-[#0a1f44] shadow-lg"
                  : "border border-transparent hover:border-blue-800/30 hover:bg-[#06234f]/60"
              }`}
            >
              {/* Avatar Section */}
              <div className="relative shrink-0">
                {chat?.user?.profilePicture ? (
                  <img
                    src={chat.user.profilePicture}
                    className="h-12 w-12 rounded-full border border-blue-500/20 object-cover"
                    alt="profile"
                  />
                ) : (
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/20 ${theme === "dark" ? "bg-[#06234f] text-blue-400" : "bg-gray-200 text-gray-500"}`}
                  >
                    <CircleUser size={28} />
                  </div>
                )}
              </div>

              {/* Text Details */}
              <div className="ml-3 min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <h2
                    className={`truncate text-[16px] font-medium ${isSelected ? "text-white" : "text-blue-50"}`}
                  >
                    {chat?.user?.fullName}
                  </h2>
                  <span className="ml-2 text-[11px] text-blue-300/70">
                    {formatTimestamp(chat?.lastMessage?.createdAt)}
                  </span>
                </div>

                <div className="mt-0.5 flex items-center justify-between">
                  <p className="truncate pr-4 text-[13px] text-blue-300/70">
                    {chat?.lastMessage?.content || "No messages"}
                  </p>

                  {/* unread count */}
                  {chat?.unreadCount > 0 && (
                    <div className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-linear-to-r from-[#2979ff] to-[#7c3aed] text-[10px] font-bold text-white shadow-[0_0_10px_rgba(41,121,255,0.4)]">
                      {chat?.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
