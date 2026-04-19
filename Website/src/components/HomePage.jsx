import React, { useEffect, useState } from "react";
import Layout from "./Layout.jsx";
import { motion } from "motion/react";
import ChatList from "../pages/ChatSection/ChatList.jsx";
import { slideLeft } from "../Services/Animation.js";
import useLayoutStore from "../Store/useLayoutStore.js";
import { getRecentChats } from "../Services/UserService.js";

const HomePage = () => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );

  return (
    <Layout>
      <motion.div {...slideLeft}>
        <ChatList  />  
      </motion.div>
    </Layout>
  );
};

export default HomePage;
