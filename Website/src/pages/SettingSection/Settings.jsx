import React, { useState } from "react";
import useThemeStore from "../../Store/useThemeStore";
import { logOutUser } from "../../Services/UserService";
import useUserStore from "../../Store/useUserStore";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSign,
  FaSignInAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Settings = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logOutUser();
      clearUser();
      toast.success("User logged out successfully");
    } catch (error) {
      console.error("Error in logOut", error);
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${theme === "dark" ? "bg-[rgb(17, 27, 33)] text-white" : "bg-white text-black"}`}
      >
        <div
          className={`w-100 border-r ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}
        >
          <div className="p-4">
            <h1 className="mb-4 text-xl font-semibold">Settings</h1>
            <div className="relative mb-4">
              <FaSearch className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings"
                className={`w-full ${theme === "dark" ? "bg-[#202c33] text-white" : "bg-gray-100 text-black"} rounded border-none p-2 pl-10 placeholder-gray-400`}
              />
            </div>

            <div
              className={`flex items-center gap-4 p-3 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"} mb-4 cursor-pointer rounded-lg`}
            >
              <img
                src={user.profilePicture}
                alt="profile"
                className="h-14 w-14 rounded-full"
              />
              <div>
                <h2 className="font-semibold">{user?.fullName}</h2>
                <p className="text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>

            {/* menu itmes */}
            <div className="h-[calc(100vh - 200px)] overflow-y-auto">
              <div className="space-y-1">
                {[
                  { icon: FaUser, label: "Account", href: "/user-profile" },
                  { icon: FaComment, label: "Chats", href: "/" },
                  { icon: FaQuestionCircle, label: "Help", href: "/help" },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.label}
                    className={`flex w-full items-center gap-3 rounded p-2 ${theme === "dark" ? "text-white hover:bg-[#202c33]" : "text-black hover:bg-gray-100"}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <div
                      className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} w-full p-4`}
                    >
                      {item.label}
                    </div>
                  </Link>
                ))}

                {/* Theme button */}
                <button
                  onClick={toggleThemeDialog}
                  className={`flex w-full items-center gap-3 rounded p-2 ${theme === "dark" ? "text-white hover:bg-[#202c33]" : "text-black hover:bg-gray-100"}`}
                >
                  {theme === "dark" ? (
                    <FaMoon className="h-5 w-5" />
                  ) : (
                    <FaSun className="h-5 w-5" />
                  )}

                  <div
                    className={`flex flex-col border-b text-start ${theme === "dark" ? "border-gray-700" : "border-gray-200"} w-full p-2`}
                  >
                    Theme
                    <span className="ml-auto text-sm text-gray-400">
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>

              <button onClick={handleLogout}
                className={`flex w-full items-center gap-3 rounded p-2 text-red-500 ${theme === "dark" ? "text-white hover:bg-[#202c33]" : "text-black hover:bg-gray-100"}`}
              >
                <FaSignInAlt className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
