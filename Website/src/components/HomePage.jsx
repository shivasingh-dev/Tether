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

  const [allUsers, setAllUsers] = useState([]);

  const getRecentChat = async () => {
    try {
      const result = await getRecentChats();
      if (result.success === true) {
        setAllUsers(result.data);
      }
    } catch (error) {
      console.error("Error in get all users", error);
    }
  };

  useEffect(() => {
    getRecentChat();
  }, []);

  // useEffect(() => {
  //   console.log("Updated Users State:", allUsers);
  // }, [allUsers]); 

  return (
    <Layout>
      <motion.div {...slideLeft}>
        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  );
};

export default HomePage;
