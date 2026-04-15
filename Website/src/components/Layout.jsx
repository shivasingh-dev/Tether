import React, { useEffect, useState } from "react";
import useLayoutStore from "../Store/useLayoutStore.js";
import { useLocation } from "react-router-dom";
import useThemeStore from "../Store/useThemeStore.js";
import { motion, AnimatePresence } from "motion/react";
import ChatWindow from "../pages/ChatSection/ChatWindow.jsx";
import Sidebar from "./Sidebar.jsx";

const Layout = ({
  children,
  isThemeDialogOpen,
  toggleThemeDialog,
  isStatusPreviewOpen,
  statusPreviewContent,
}) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"}`}
    >
      {/* Sidebar: Desktop par side mein, Mobile par bottom mein  */}
      {!isMobile && <Sidebar />}

      <div
        className={`flex-1 flex relative overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}
      >
        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatList"
              initial={{ x: isMobile ? "-100%" : "0" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full md:w-[31.5%] border-r border-gray-700/20 h-full`}
            >
              {children}
            </motion.div>
          )}

          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatWindow"
              className="flex-1 h-full"
              initial={isMobile ? { x: "100%" } : {}}
              animate={{ x: 0 }}
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Mobile Bottom Navigation Sidebar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 w-full z-40">
          <Sidebar />
        </div>
      )}

      {isThemeDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className={`${theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black"} p-6 rounded-lg shadow-lg max-w-sm w-full`}
          >
            <h2 className="text-2xl font-semibold mb-4">Choose a theme</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="light"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className="text-blue-600"
                />
                <span>Light</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="dark"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className="text-blue-600"
                />
                <span>Dark</span>
              </label>
            </div>
            <button onClick={toggleThemeDialog} className="mt-6 w-full bg-blue-500 rounded text-white py-2 hover:bg-blue-600 transition duration-200">
              Close
            </button>
          </div>
        </div>
      )}

      {/* status preview */}
      {isStatusPreviewOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          {statusPreviewContent}
        </div>
      )}


    </div>
  );
};
export default Layout;
