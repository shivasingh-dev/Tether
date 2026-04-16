import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../Store/useThemeStore.js";
import useUserStore from "../Store/useUserStore.js";
import useLayoutStore from "../Store/useLayoutStore.js";
import { IoChatbubbles } from "react-icons/io5";
import { motion } from "framer-motion"; 
import { slideLeft } from "../Services/Animation.js";
import { MdRadioButtonChecked } from "react-icons/md";
import { FaUserCircle, FaCog } from "react-icons/fa";
import { useChatStore } from "../Store/useChatStore.js";

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActiveTab("chats");
    else if (path === "/status") setActiveTab("status");
    else if (path === "/user-profile") setActiveTab("profile");
    else if (path === "/settings") setActiveTab("settings");
  }, [location.pathname, setActiveTab]);

  // Mobile par chat open hone par sidebar hide karna 
  if (isMobile && selectedContact) return null;

  const NavLink = ({ to, tabName, icon: Icon }) => {
    const isActive = activeTab === tabName;
    return (
      <Link
        to={to}
        className={`relative flex items-center justify-center transition-all duration-300 ${
          isMobile ? "p-2" : "mb-6 w-12 h-12"
        }`}
      >
        <div className={`p-2.5 rounded-full transition-all ${
          isActive 
            ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
            : "text-blue-200/40 hover:text-blue-300 hover:bg-white/5"
        }`}>
          <Icon size={isMobile ? 24 : 22} />
        </div>
        
        {/* Active Indicator Bar (Desktop Only) */}
        {isActive && !isMobile && (
          <motion.div 
            layoutId="activeSideBarTab"
            className="absolute left-0 w-1 h-6 bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
          />
        )}
      </Link>
    );
  };

  return (
    <motion.div
      {...slideLeft}
      className={`
        ${isMobile 
          ? "fixed bottom-0 left-0 right-0 h-16 overflow-x-hidden flex-row justify-around items-center px-6 border-t" 
          : "w-14.5 h-screen flex-col items-center py-8 border-r"} 
        ${theme === "dark" 
          ? "bg-[#030b1e] border-blue-500/40" 
          : "bg-white border-gray-200"} 
        flex z-50 transition-all duration-500
      `}
    >
      {/* Top Icons */}
      <div className={`flex ${isMobile ? "flex-row w-full justify-around items-center" : "flex-col items-center"}`}>
        <NavLink to="/" tabName="chats" icon={IoChatbubbles} />
        <NavLink to="/status" tabName="status" icon={MdRadioButtonChecked} />
        
        {/* Mobile par Profile/Settings bhi line mein aayenge */}
        {isMobile && (
          <>
            <NavLink to="/user-profile" tabName="profile" icon={FaUserCircle} />
            <NavLink to="/settings" tabName="settings" icon={FaCog} />
          </>
        )}
      </div>

      {!isMobile && (
        <>
          <div className="grow" />
          {/* Bottom Icons for Desktop */}
          <div className="flex flex-col items-center">
            <Link
              to="/user-profile"
              className={`mb-6  rounded-full border-2 transition-all p-0.5 ${
                activeTab === "profile" ? "border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "border-transparent"
              }`}
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} className="h-8 w-8 rounded-full object-cover" alt="pfp" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-300">
                  <FaUserCircle size={20} />
                </div>
              )}
            </Link>
            <NavLink to="/settings" tabName="settings" icon={FaCog} />
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Sidebar;