import React, { useState } from "react";
import useThemeStore from "../../Store/useThemeStore";
import { logOutUser } from "../../Services/UserService";
import useUserStore from "../../Store/useUserStore";
import Layout from "../../components/Layout";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignInAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";

const Settings = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutModal(false);
      await logOutUser();
      clearUser();
      toast.success("Log out successfully", { position: "bottom-left" });
    } catch (error) {
      console.error("Error in logOut", error);
      toast.error("Failed to logout. Please try again", { position: "top-right" });
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // Menu items array
  const menuItems = [
    { icon: FaUser, label: "Account", href: "/user-profile" },
    { icon: FaComment, label: "Chats", href: "/" },
    { icon: FaQuestionCircle, label: "Help", href: "https://tether-policy-page.vercel.app/" },
  ];

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notfiyLightTheme = () => {
    toast.message("Light theme will be available in upcoming updates", {
      position: "bottom-left",
    });
  };

  // Check if theme matches search
  const showTheme =
    "theme".includes(searchQuery.toLowerCase()) ||
    theme.includes(searchQuery.toLowerCase()) ||
    searchQuery === "";

  // Check if logout matches search
  const showLogout =
    "logout".includes(searchQuery.toLowerCase()) ||
    "log out".includes(searchQuery.toLowerCase()) ||
    searchQuery === "";

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {/* Filtered menu items with external link support */}
                {filteredMenuItems.map((item) => {
                  const isExternal = item.href.startsWith("http");

                  return isExternal ? (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
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
                    </a>
                  ) : (
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
                  );
                })}

                {/* Theme button - conditionally render */}
                {showTheme && (
                  <button
                    onClick={notfiyLightTheme}
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
                )}

                {/* Logout - conditionally render */}
                {showLogout && (
                  <button
                    onClick={handleLogoutClick}
                    className={`mt-2 flex w-full items-center cursor-pointer gap-4 rounded-lg px-3 py-2 text-red-400 transition-all hover:bg-red-500/10`}
                  >
                    <FaSignInAlt className="h-5 w-5 shrink-0" />
                    <span className="text-sm">Log out</span>
                  </button>
                )}

                {/* No results message */}
                {filteredMenuItems.length === 0 && !showTheme && !showLogout && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400">
                      No settings found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className={`w-[90%] max-w-md rounded-3xl p-6 shadow-2xl ${
              theme === "dark" ? "bg-[#06234f]" : "bg-white"
            }`}
          >
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <FaSignInAlt className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <h2
              className={`mb-3 text-center text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Ready to leave?
            </h2>

            <p className="mb-6 text-center text-sm leading-relaxed text-gray-400">
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 rounded-xl bg-gray-700 py-3.5 font-semibold text-white transition-all hover:bg-gray-600"
              >
                Not Yet
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-xl bg-red-500 py-3.5 font-semibold text-white transition-all hover:bg-red-600"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;