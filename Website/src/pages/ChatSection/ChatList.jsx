import React, { useState } from "react";
import useLayoutStore from "../../Store/useLayoutStore.js";
import useThemeStore from "../../Store/useThemeStore.js";
import useUserStore from "../../Store/useUserStore.js";
import { FolderPlus, Search, CircleUser } from "lucide-react";
import { motion } from "motion/react";
import formatTimestamp from "../../Utils/formatTime.js";

const ChatList = ({ contacts }) => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerms, setSearchTerms] = useState("");
  const filteredContacts = contacts?.filter((contact) =>
    contact?.user?.fullName?.toLowerCase().includes(searchTerms.toLowerCase()),
  );

  return (
    <div className={`w-full h-screen border-r border-blue-900/30 bg-[#020818]`}>
      
      {/* Header */}
      <div className="px-5 py-3 flex justify-between items-center border-b border-blue-900/30">
        <h2 className="text-2xl font-black bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent tracking-tight">
          Tether
        </h2>
        {/* new chat icon */}
        <button className="relative p-2 flex items-center justify-center rounded-full text-blue-400 transition-all duration-300 hover:bg-blue-800 hover:text-blue-200 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer active:bg-blue-500/30">
          <FolderPlus size={22} />
        </button>
      </div>

      {/* search bar */}
      <div className="px-4 pt-3 pb-1.5">
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-300 transition-colors"
            size={17}
          />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-1.5 bg-[#06234f]  rounded-full text-white outline-none placeholder:text-blue-300/30 focus:border-blue-400 focus:ring-1 focus:ring-blue-500 transition-all focus:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>

      {/* recent chats list */}
      <div className="overflow-y-auto h-[calc(100vh-140px)]">
        {filteredContacts?.map((chat) => {
          const isSelected = selectedContact?._id === chat.user?._id;

          return (
            <motion.div
              key={chat.conversationId}
              onClick={() => setSelectedContact(chat.user)}
              className={`mx-4 my-1 p-3 flex items-center cursor-pointer transition-all rounded-xl ${
                isSelected
                  ? "bg-[#0a1f44] border border-blue-500/50 shadow-lg"
                  : "hover:bg-[#06234f]/60 border border-transparent hover:border-blue-800/30"
              }`}
            >
              {/* Avatar Section */}
              <div className="relative shrink-0">
                {chat?.user?.profilePicture ? (
                  <img
                    src={chat.user.profilePicture}
                    className="h-12 w-12 rounded-full object-cover border border-blue-500/20"
                    alt="profile"
                  />
                ) : (
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center border border-blue-500/20 ${theme === "dark" ? "bg-[#06234f] text-blue-400" : "bg-gray-200 text-gray-500"}`}
                  >
                    <CircleUser size={28} />
                  </div>
                )}
              </div>

              {/* Text Details */}
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h2
                    className={`font-medium text-[16px] truncate ${isSelected ? "text-white" : "text-blue-50"}`}
                  >
                    {chat?.user?.fullName}
                  </h2>
                  <span className="text-[11px] text-blue-300/40 ml-2">
                    {formatTimestamp(chat?.lastMessage?.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-[13px] text-blue-200/50 truncate pr-4">
                    {chat?.lastMessage?.content || "No messages"}
                  </p>

                  {/* unread count */}
                  {chat?.unreadCount > 0 && (
                    <div className="bg-linear-to-r from-[#2979ff] to-[#7c3aed] text-white text-[10px] font-bold min-w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(41,121,255,0.4)]">
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
