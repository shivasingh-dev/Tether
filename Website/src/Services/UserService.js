import axiosInstance from "./UrlService.js";

export const loginWithEmail = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/email-login", {
      email,
      password,
    });
    console.log("Full response:", response.data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: error.message };
  }
};

export const updateUserProfile = async (updateData) => {
  try {
    const response = await axiosInstance.put("/update/profile", updateData);
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: error.message };
  }
};

export const checkAuth = async () => {
  try {
    const { data } = await axiosInstance.get("/update/check-auth");
    return { isAuthenticated: data.success, user: data.data || null };
  } catch (error) {
    throw error?.response?.data || { message: error.message };
  }
};

export const logOutUser = async () => {
  try {
    const response = await axiosInstance.get("/update/log-out");
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: error.message };
  }
};

export const getRecentChats = async () => {
  try {
    const response = await axiosInstance.get("/update/recent-chats");
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: error.message };
  }
};

export const clearChat = async () => {
  try {
    const response = await axiosInstance.delete("/clear/:conversationId", {conversationId});
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: error.message };
  }
};
