import React, { use, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Welcome from "./pages/WelcomeSection/Welcome";
import ChatList from "./pages/ChatSection/ChatList.jsx";
import { ToastContainer, toast } from "react-toastify";
import { ProtectedRoute, PublicRoute } from "./protected.jsx";
import HomePage from "./components/HomePage.jsx";
import UserDetails from "./components/UserDetails.jsx";
import Status from "./pages/StatusSection/Status.jsx";
import Settings from "./pages/SettingSection/Settings.jsx";
import useUserStore from "./Store/useUserStore.js";
import { disconnectSocket, initializeSocket } from "./Services/ChatServices.js";
import { useChatStore } from "./Store/useChatStore.js";
import { Toaster } from "@/components/ui/sonner"

const App = () => {
  const { user } = useUserStore();
  const { setCurrentUser, initSocketListeners, cleanUp, fetchConversations } =
    useChatStore();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();

      if (socket) {
        setCurrentUser(user);
        initSocketListeners();
        fetchConversations();
      }
    }

    return () => {
      cleanUp();
      disconnectSocket();
    };
  }, [user?._id]);

  return (
    <>
      <ToastContainer />
      <Toaster  />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/welcome" element={<Welcome />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/user-profile" element={<UserDetails />} />
          <Route path="/status" element={<Status />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat-list" element={<ChatList />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
