import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, User, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { getSavedContacts } from "../Services/UserService";
import useLayoutStore from "../Store/useLayoutStore";
import { useChatStore } from "../Store/useChatStore";
import useUserStore from "../Store/useUserStore";

const AllSavedContacts = ({ onBack }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState("");
  
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const { conversations } = useChatStore();
  const { user: currentUser } = useUserStore();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await getSavedContacts();
        if (response.success) {
          if (response.data.length > 0) {
            setContacts(response.data);
          } else {
            // Fallback: If no saved contacts, show recent chat participants
            const convList = Array.isArray(conversations) ? conversations : (conversations?.data || []);
            const recentParticipants = convList
              .map(conv => conv.participants || [])
              .flat()
              .filter(p => p && p._id !== currentUser?._id);
            
            // Deduplicate
            const uniqueParticipants = Array.from(new Set(recentParticipants.map(p => p._id)))
              .map(id => recentParticipants.find(p => p._id === id));
              
            setContacts(uniqueParticipants);
          }
        }
      } catch (error) {
        console.error("Error fetching saved contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [conversations, currentUser]);

  const handleContactClick = (contact) => {
    // Check if conversation already exists
    const convList = Array.isArray(conversations) ? conversations : (conversations?.data || []);
    const existingConv = convList.find(conv => 
      conv.participants.some(p => p._id === contact._id)
    );

    if (existingConv) {
      const otherUser = existingConv.participants.find(p => p._id !== currentUser?._id);
      setSelectedContact({
        conversationId: existingConv._id,
        user: otherUser,
        displayName: currentUser?.contactMappings?.[otherUser?.phoneNumber] || otherUser?.fullName || otherUser?.phoneNumber,
        lastMessage: existingConv.lastMessage,
        unreadCount: 0
      });
    } else {
      // Start new chat - pass a pseudo contact object
      setSelectedContact({
        conversationId: null, // New chat
        user: contact,
        displayName: currentUser?.contactMappings?.[contact.phoneNumber] || contact.fullName || contact.phoneNumber,
        lastMessage: null,
        unreadCount: 0
      });
    }
    onBack(); // Close the contacts list
  };

  const filteredContacts = contacts.filter(contact => 
    (contact.fullName || "").toLowerCase().includes(searchTerms.toLowerCase()) ||
    (contact.phoneNumber || "").includes(searchTerms)
  );

  return (
    <div className="h-screen w-full border-r border-blue-900/30 bg-[#020818] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="p-2 mr-2 rounded-full hover:bg-blue-800/30 text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-2xl font-black tracking-tight text-transparent">
            New Chat
          </h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-300" size={16} />
          <input 
            type="text"
            placeholder="Search contacts..."
            className="w-full bg-[#06234f] text-white py-2 pl-10 pr-4 rounded-full outline-none focus:ring-1 focus:ring-blue-500 focus:bg-[#020818] transition-all"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-blue-300/50">
            <User size={40} className="mb-2 opacity-20" />
            <p>No contacts found</p>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const displayName = currentUser?.contactMappings?.[contact.phoneNumber] || contact.fullName || contact.phoneNumber;
            
            return (
              <div 
                key={contact._id}
                onClick={() => handleContactClick(contact)}
                className="mx-2 my-1 flex items-center p-3 rounded-xl cursor-pointer hover:bg-[#06234f]/60 transition-all border border-transparent hover:border-blue-800/20"
              >
                <div className="relative">
                  {contact.profilePicture ? (
                    <img src={contact.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover border border-blue-500/20" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#06234f] flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#020818] rounded-full" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-blue-50 font-medium truncate">
                    {displayName}
                  </h3>
                  <p className="text-blue-300/50 text-xs truncate mt-0.5">
                    {contact.about || "Hey there! I am using Tether"}
                  </p>
                </div>
                <MessageSquare size={18} className="text-blue-400/30 ml-2" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllSavedContacts;
