import Layout from "../../components/Layout";
import useStatusStore from "@/Store/useStatusStore";
import useThemeStore from "@/Store/useThemeStore";
import useUserStore from "@/Store/useUserStore";
import React, { useEffect, useState } from "react";
import StatusPreview from "./StatusPreview";
import { motion } from "motion/react";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaEllipsisH, FaPlus } from "react-icons/fa";
import formatTimestamp from "@/Utils/data";
import StatusList from "./StatusList";

const Status = () => {
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  // status store
  const {
    statuses,
    loading,
    error,
    createStatus,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    getUserStatuses,
    getOtherStatuses,
    fetchStatuses,
    clearError,
    reset,
    initializeSocket,
    cleanUpSocket,
  } = useStatusStore();

  const userStatus = getUserStatuses(user?._id);
  const otherStatus = getOtherStatuses(user?._id);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    setShowFileMenu(false);
    e.target.value = ""; // Same file dobara select kar sake

    if (file.type.startsWith("image/")) {
      const objectURL = URL.createObjectURL(file);
      setEditorImage(objectURL);
      setSelectedFile(file);
      setShowEditor(true);
    } else {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;

    try {
      await createStatus({
        content: newStatus,
        file: selectedFile,
      });

      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error("Error in handle create status", error);
    }
  };

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.error("Error in handle view status", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOption(false);
      handlePreviewClose();
    } catch (error) {
      console.error("Error in handle delete status", error);
    }
  };

  const handlePreviewClose = async (statusId) => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact?.statuses?.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleStatusPreview = (contact, statusIndex) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);

    if (contact?.statuses[statusIndex]) {
      handleViewStatus(contact?.statuses[statusIndex].id);
    }
  };

  useEffect(() => {
    fetchStatuses();
    initializeSocket();
    return () => {
      cleanUpSocket();
    };
  }, [user?._id]);

  // clear the error when the page is mounts again
  useEffect(() => {
    return () => clearError();
  }, []);

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className={`flex h-screen flex-col border-r ${theme === "dark" ? "bg-[rgb(12, 19, 24)] border-gray-600 text-white" : "bg-gray-100 text-black"}`}
      >
        <div
          className={`flex items-center justify-between shadow-md ${theme === "dark" ? "bg-[rgb(17, 27, 33)] text-white" : "bg-white"} p-4`}
        >
          <h2 className="text-2xl font-bold">Status</h2>
        </div>

        {error && (
          <div className="mx-4 mt-2 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={clearError}
              className="float-right text-red-500 hover:text-red-600"
            >
              <RxCross2 className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          <div
            className={`flex space-x-4 p-3 shadow-md ${theme === "dark" ? "bg-[rgb(17, 27, 33)]" : "bg-white"} p-4`}
          >
            <div
              className="relative cursor-pointer"
              onClick={() =>
                userStatus
                  ? handleStatusPreview(userStatus)
                  : setShowCreateModel(true)
              }
            >
              <img
                src={user?.profilePicture}
                alt="user?.fullName"
                className="h-12 w-12 rounded-full object-cover"
              />

              {userStatus ? (
                <>
                  <svg
                    className="absolute top-0 left-0 h-12 w-12"
                    viewBox="0 0 100 100"
                  >
                    {userStatus?.statuses.map((_, index) => {
                      const total = userStatus.statuses.length;
                      const circumference = 2 * Math.PI * 48;
                      const gap = 6;
                      const segmentLength =
                        (circumference - gap * total) / total;
                      const offset = index * (segmentLength + gap);

                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="48"
                          fill="none"
                          stroke="#25D366"
                          strokeWidth="4"
                          strokeDasharray={`${segmentLength} ${circumference}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 50 50)"
                        />
                      );
                    })}
                  </svg>

                  <button
                    className="absolute right-0 bottom-0 rounded-full bg-green-500 p-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateModel(true);
                    }}
                  >
                    <FaPlus className="h-2 w-2" />
                  </button>
                </>
              ) : (
                <button
                  className="absolute right-0 bottom-0 rounded-full bg-green-500 p-1 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModel(true);
                  }}
                >
                  <FaPlus className="h-2 w-2" />
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-col items-start">
              <p className="font-semibold">My Status</p>

              <p
                className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                {userStatus
                  ? `${userStatus?.statuses?.length} status${userStatus?.statuses?.length > 1 ? "es" : ""} ${formatTimestamp(userStatus?.statuses?.[userStatus?.statuses?.length - 1]?.timestamp)}`
                  : "Tap to add status"}
              </p>
            </div>

            {userStatus && (
              <button
                className="ml-auto"
                onClick={() => setShowOption(!showOption)}
              >
                <FaEllipsisH
                  className={`h-5 w-5${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                />
              </button>
            )}
          </div>

          {/* Options menu */}
          {showOption && userStatus && (
            <div
              className={`p-2 shadow-md ${theme === "dark" ? "bg-[rgb(17, 27, 33)]" : "bg-white"} p-4`}
            >
              <button
                className="flex w-full items-center rounded px-2 py-2 text-left text-green-500 hover:bg-gray-100"
                onClick={() => {
                  setShowCreateModel(true);
                  setShowOption(false);
                }}
              >
                <FaCamera className="mr-2 inline-block" /> Add Status
              </button>

              <button
                className="w-full rounded px-2 py-2 text-left text-blue-500 hover:bg-gray-100"
                onClick={() => {
                  handleStatusPreview(userStatus);
                  setShowOption(false);
                }}
              >
                View Status
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Recent updates from other users */}
          {!loading && otherStatus?.length > 0 && (
            <div
              className={`mt-4 space-y-4 p-4 shadow-md ${theme === "dark" ? "bg-[rgb(17, 27, 33)]" : "bg-white"} p-4`}
            >
              <h3
                className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Recent Updates
              </h3>

              {otherStatus?.map((contact, index) => (
                <React.Fragment key={contact?.id}>
                  <StatusList contact={contact} onPreview={() => handleStatusPreview(contact)} theme={theme} /> 
                    {index < otherStatus?.length - 1 && (
                      <hr className={`${theme === 'dark' ? "border-gray-400" : "border-gray-500"}`} />
                    )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && statuses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className={`text-2xl mb-4 ${theme === 'dark' ? "text-gray-600" : "text-gray-300"}`}>
                Status update will be displayed here
              </div>
            </div>
          )}
        </div>

        {showCreateModel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${theme  === 'dark' ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? "text-white" : "text-black"}`}>Create Status</h3>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Status;
