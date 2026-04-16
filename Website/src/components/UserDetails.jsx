import React, { useEffect, useState } from "react";
import useUserStore from "../Store/useUserStore";
import { updateUserProfile } from "../Services/UserService";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { motion } from "motion/react";
import { fadeIn } from "../Services/Animation";
import useThemeStore from "../Store/useThemeStore";
import { FaCamera, FaCheck, FaPencilAlt, FaSmile } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";

const UserDetails = () => {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (user) {
      setName(user.fullName || "");
      setAbout(user.about || "");
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = (field) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      if (field === "name") {
        formData.append("fullName", name);
        setIsEditingName(false);
        setShowNameEmoji(false);
      } else if (field === "about") {
        formData.append("about", about);
        setIsEditingAbout(false);
        setShowAboutEmoji(false);
      }

      if (profilePicture && field === "profile") {
        formData.append("media", profilePicture);
      }

      const updated = updateUserProfile(formData);
      setUser(updated?.data);
      setProfilePicture(null);
      setPreview(null);
      toast.success("Profile Updated");
      setIsLoading(false);
    } catch (error) {
      console.error("Error in profie updated", error);
      toast.error("Failed to update profile");
    }
  };

  const handleEmojiSelect = (emoji, field) => {
    if (field === "name") {
      setName((prev) => prev + emoji.emoji);
      setShowNameEmoji(false);
    } else {
      setAbout((prev) => prev + emoji.emoji);
      setShowAboutEmoji(false);
    }
  };

  return (
    <Layout>
      <motion.div
        {...fadeIn}
        className={`flex min-h-screen w-full border-r ${theme === "dark" ? "bg-[rgb(17, 27, 33)] text-whit border-gray-600" : "border-gray-200 bg-gray-100 text-black"}`}
      >
        <div className="w-full rounded-lg p-6">
          <div className="mb-6 flex items-center">
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="group: relative">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="profile photo"
                    className="mb-2 h-40 w-40 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
                    <span className="text-7xl font-semibold text-blue-400">
                      {user?.fullName[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <label
                  htmlFor="profileUpload"
                  className="bg-opacity-50 absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <div className="text-center text-white">
                    <FaCamera className="mx-auto mb-2 h-8 w-8" />
                    <span>Change</span>
                  </div>
                  <input
                    type="file"
                    id="profileUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {preview && (
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={() => {
                    handleSave("profile");
                  }}
                  className="cursor-pointer rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  {isLoading ? "Saving..." : "Change"}
                </button>
                <button
                  onClick={() => {
                    setProfilePicture(null);
                    setPreview(null);
                  }}
                  className="cursor-pointer rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
                >
                  Discard
                </button>
              </div>
            )}

            {/* Name */}
            <div className="relative rounded-lg bg-gray-800 p-4 shadow-sm">
              <label
                htmlFor="name"
                className="block text-start text-sm text-gray-500"
              >
                Your Name
              </label>
              <div className="flex items-center">
                {isEditingName ? (
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border bg-gray-700 px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                ) : (
                  <span className="w-full px-3 py-2">
                    {user?.fullName || name}
                  </span>
                )}

                {isEditingName ? (
                  <>
                    <button
                      onClick={() => handleSave("name")}
                      className="ml-2 focus:outline-none"
                    >
                      <FaCheck className="h-5 w-5 text-green-500" />
                    </button>
                    <button
                      onClick={() => setShowNameEmoji(!showNameEmoji)}
                      className="ml-2 focus:outline-none"
                    >
                      <FaSmile className="h-5 w-5 text-yellow-500" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setShowNameEmoji(false);
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <MdCancel className="h-5 w-5 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingName(!isEditingName)}
                    className="ml-2 focus:outline-none"
                  >
                    <FaPencilAlt className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>

              {showNameEmoji && (
                <div className="absolute -top-80 z-10">
                  <EmojiPicker
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "name")}
                  />
                </div>
              )}
            </div>

            {/* About */}
            <div className="relative rounded-lg bg-gray-800 p-4 shadow-sm">
              <label
                htmlFor="about"
                className="block text-start text-sm text-gray-500"
              >
                About
              </label>
              <div className="flex items-center">
                {isEditingAbout ? (
                  <input
                    type="text"
                    id="about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full rounded-md border bg-gray-700 px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                ) : (
                  <span className="w-full px-3 py-2">
                    {user?.about || "Hey there, I am using Tether"}
                  </span>
                )}

                {isEditingAbout ? (
                  <>
                    <button
                      onClick={() => handleSave("about")}
                      className="ml-2 focus:outline-none"
                    >
                      <FaCheck className="h-5 w-5 text-green-500" />
                    </button>
                    <button
                      onClick={() => setShowAboutEmoji(!showAboutEmoji)}
                      className="ml-2 focus:outline-none"
                    >
                      <FaSmile className="h-5 w-5 text-yellow-500" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAbout(false);
                        setShowAboutEmoji(false);
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <MdCancel className="h-5 w-5 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingAbout(!isEditingAbout)}
                    className="ml-2 focus:outline-none"
                  >
                    <FaPencilAlt className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>

              {showAboutEmoji && (
                <div className="absolute -top-80 z-10">
                  <EmojiPicker
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "about")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default UserDetails;
