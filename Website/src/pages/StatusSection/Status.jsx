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
import ImageEditor from "../../components/ImageEditor";
import useOutsideClick from "../../hooks/useOutsideClick";
import { toast } from "sonner";

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
      setShowCreateModel(false);
      toast.success("Status created successfully!");
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

  const handleStatusPreview = (contact, statusIndex = 0) => {
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
        className="flex h-screen flex-col border-r border-blue-900/30 bg-[#020818] text-white"
      >
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-2xl font-black tracking-tight text-transparent cursor-default">
            Status
          </h2>
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
          <div className="mx-4 my-2 flex items-center rounded-xl p-3 border border-blue-800/30 bg-[#06234f]/60 shadow-lg">
            <div
              className="relative cursor-pointer shrink-0"
              onClick={() =>
                userStatus
                  ? handleStatusPreview(userStatus)
                  : setShowCreateModel(true)
              }
            >
              {user?.profilePicture ? (
                <img
                  src={user?.profilePicture}
                  alt={user?.fullName}
                  className="h-12 w-12 rounded-full border border-blue-500/20 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
                  <span className="text-xl font-bold text-blue-400">
                    {user?.fullName?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}

              {userStatus ? (
                <>
                  <svg
                    className="absolute top-0 left-0 h-12 w-12"
                    viewBox="0 0 100 100"
                  >
                    {userStatus?.statuses.map((_, index) => {
                      const total = userStatus.statuses.length;
                      const circumference = 2 * Math.PI * 48;
                      const gap = total > 1 ? 6 : 0;
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
                          stroke="#2979ff"
                          strokeWidth="4"
                          strokeDasharray={`${segmentLength} ${circumference}`}
                          strokeDashoffset={-offset}
                          transform={`rotate(-90 50 50)`}
                        />
                      );
                    })}
                  </svg>

                  <button
                    className="absolute right-0 bottom-0 rounded-full bg-blue-600 p-1 text-white shadow-[0_0_10px_rgba(41,121,255,0.4)] cursor-pointer"
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
                  className="absolute right-0 bottom-0 rounded-full bg-blue-600 p-1 text-white shadow-[0_0_10px_rgba(41,121,255,0.4)] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModel(true);
                  }}
                >
                  <FaPlus className="h-2 w-2" />
                </button>
              )}
            </div>

            <div className="ml-3 flex flex-1 flex-col items-start">
              <p className="font-medium text-white">My Status</p>

              <p className="text-[13px] text-blue-300/70">
                {userStatus
                  ? `${userStatus?.statuses?.length} status${userStatus?.statuses?.length > 1 ? "es" : ""} ${formatTimestamp(userStatus?.statuses?.[userStatus?.statuses?.length - 1]?.timestamp)}`
                  : "Tap to add status"}
              </p>
            </div>

            {userStatus && (
              <button
                className="ml-auto cursor-pointer"
                onClick={() => setShowOption(!showOption)}
              >
                <FaEllipsisH className="h-5 w-5 text-blue-400 hover:text-blue-200 transition-colors" />
              </button>
            )}
          </div>

          {/* Options menu */}
          {showOption && userStatus && (
            <div className="mx-4 mb-4 rounded-lg bg-[#06234f] p-2 shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-900/30">
              <button
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-blue-400 hover:bg-[#020818] transition-colors"
                onClick={() => {
                  setShowCreateModel(true);
                  setShowOption(false);
                }}
              >
                <FaCamera className="mr-2 inline-block" /> Add Status
              </button>

              <button
                className="mt-1 w-full rounded-md px-3 py-2 text-left text-blue-400 hover:bg-[#020818] transition-colors"
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
            <div className="mt-4">
              <h3 className="px-5 pb-2 text-sm font-semibold text-blue-400">
                Recent Updates
              </h3>

              <div className="space-y-1">
                {otherStatus?.map((contact, index) => (
                  <React.Fragment key={contact?.id}>
                    <StatusList
                      contact={contact}
                      onPreview={() => handleStatusPreview(contact)}
                      theme={theme}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {!loading && otherStatus.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
              <span className="mb-3 text-4xl">📱</span>
              <div className="text-[14px] text-blue-300/50">
                Status updates will appear here
              </div>
            </div>
          )}
        </div>

        {showCreateModel && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-linear-to-br from-[#05164a] via-[#050a1f] to-[#0a1f44] p-6 shadow-[0_0_60px_rgba(59,130,246,0.3)] border border-blue-900/50">
              <h3 className="text-xl font-bold text-white mb-6">
                Create Status
              </h3>

              {filePreview && (
                <div className="mb-4 border-t border-blue-900/30 bg-[#020818] px-4 py-2">
                  <div className="relative mx-auto w-fit">
                    {selectedFile?.type.startsWith("video/") ? (
                      <video
                        src={filePreview}
                        controls
                        className="h-32 w-full rounded object-cover"
                      />
                    ) : (
                      <img
                        src={filePreview}
                        className="h-32 w-full rounded object-cover"
                        alt="preview"
                      />
                    )}

                    {/* File info */}
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#06234f]/60 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-lg">
                          {selectedFile?.type.startsWith("video/")
                            ? "🎥"
                            : "🖼️"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs text-blue-200">
                            {selectedFile?.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatFileSize(selectedFile?.size)}
                          </p>
                        </div>
                      </div>

                      {/* ── Edit button: sirf images ke liye ── */}
                      {!selectedFile?.type.startsWith("video/") && (
                        <button
                          onClick={() => {
                            setEditorImage(filePreview);
                            setShowEditor(true);
                          }}
                          className="shrink-0 rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-[11px] font-semibold text-blue-300 transition-colors hover:bg-blue-600/40 cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind?"
                className="mb-4 w-full rounded-xl border border-blue-600 bg-[#06234f] p-3 text-white outline-none focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] placeholder:text-blue-300/30"
                rows={3}
              />

            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="mb-6 block w-full text-sm text-blue-300/70 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-400 hover:file:bg-blue-600/30"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModel(false);
                  setSelectedFile(null);
                  setFilePreview(null);
                  setNewStatus("");
                }}
                disabled={loading}
                className="px-4 py-2 text-blue-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

               <button
                onClick={handleCreateStatus}
                disabled={loading || (!newStatus.trim() && !selectedFile)}
                className="rounded-xl bg-linear-to-r from-[#2979ff] to-[#7c3aed] px-5 py-2 font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(41,121,255,0.4)] disabled:opacity-50 active:scale-95"
             > {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
           </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Status;
