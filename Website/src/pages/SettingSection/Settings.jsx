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
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-linear-to-br from-[#020818] via-[#030f2e] to-[#020818] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-full max-w-sm overflow-y-auto sidebar-scrollbar border-r bg-transparent ${
            theme === "dark" ? "border-blue-900/30" : "border-gray-200"
          }`}
        >
          <div className="p-4">
            {/* Header */}
            <h1 className="mb-4 text-xl font-bold">Settings</h1>

            {/* Search bar */}
            <div className="relative mb-4">
              <FaSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                placeholder="Search settings"
                className={`w-full rounded-lg border-none py-2 pr-4 pl-10 text-sm outline-none placeholder:text-gray-500 ${
                  theme === "dark"
                    ? "bg-[#06234f] text-white focus:ring-1 focus:ring-blue-500"
                    : "bg-gray-100 text-black"
                }`}
              />
            </div>

            {/* Profile section */}
            <div
              className={`mb-4 flex items-center gap-4 rounded-xl p-3 ${
                theme === "dark" ? "hover:bg-[#06234f]/60" : "hover:bg-gray-100"
              } transition-all`}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="profile"
                  className="h-14 w-14 shrink-0 rounded-full border border-blue-500/20 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
                  <span className="text-xl font-bold text-blue-400">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{user?.fullName}</h2>
                <p className="truncate text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="h-[calc(100vh-260px)] overflow-y-auto">
              <div className="space-y-1">
                {[
                  { icon: FaUser, label: "Account", href: "/user-profile" },
                  { icon: FaComment, label: "Chats", href: "/" },
                  { icon: FaQuestionCircle, label: "Help", href: "/help" },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.label}
                    className={`flex w-full items-center gap-4 rounded-lg px-3 py-2 transition-all ${
                      theme === "dark"
                        ? "text-white hover:bg-[#06234f]/60"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0 text-blue-400" />
                    <div
                      className={`w-full border-b py-3 text-sm ${
                        theme === "dark"
                          ? "border-blue-900/30"
                          : "border-gray-200"
                      }`}
                    >
                      {item.label}
                    </div>
                  </Link>
                ))}

                {/* Theme button */}
                <button
                  onClick={toggleThemeDialog}
                  className={`flex w-full items-center gap-4 cursor-pointer rounded-lg px-3 py-2 transition-all ${
                    theme === "dark"
                      ? "text-white hover:bg-[#06234f]/60"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  {theme === "dark" ? (
                    <FaMoon className="h-5 w-5 shrink-0 text-blue-400" />
                  ) : (
                    <FaSun className="h-5 w-5 shrink-0 text-yellow-400" />
                  )}
                  <div
                    className={`flex w-full items-center justify-between border-b py-3 text-sm ${
                      theme === "dark"
                        ? "border-blue-900/30"
                        : "border-gray-200"
                    }`}
                  >
                    <span>Theme</span>
                    <span className="text-gray-400">
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`mt-2 flex w-full items-center cursor-pointer gap-4 rounded-lg px-3 py-2 text-red-400 transition-all hover:bg-red-500/10`}
            >
              <FaSignInAlt className="h-5 w-5 shrink-0" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
