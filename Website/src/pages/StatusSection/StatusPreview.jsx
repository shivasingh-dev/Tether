import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import formatTimestamp from "@/Utils/data";
import useUserStore from "@/Store/useUserStore";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
  FaEllipsisV,
  FaPlay,
  FaPause,
} from "react-icons/fa";
import { toast } from "sonner";

const StatusPreview = ({
  contact,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
  theme,
  currentUser,
  loading,
}) => {
  const { user } = useUserStore();
  const displayName = user?.contactMappings?.[contact?.phoneNumber] || contact?.name || "Unknown";
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentStatus = contact?.statuses?.[currentIndex];
  const isOwner = contact?.id === currentUser?._id;
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused || showMenu || showViewers || showDeleteConfirm) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, showMenu, showViewers, showDeleteConfirm, onNext]);

  const handleViewersToggle = () => {
    setShowViewers(!showViewers);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete && currentStatus?.id) {
      onDelete(currentStatus.id);
      toast.success("Status deleted");
    }
    setShowDeleteConfirm(false);
    if (contact?.statuses?.length === 1) {
      onClose();
    } else {
      onNext();
    }
  };

  if (!currentStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-full bg-[#020818] relative overflow-hidden">
          <div className="absolute top-4 right-4 left-4 z-20 flex justify-between gap-1 p-0">
            {contact?.statuses?.map((_, index) => (
              <div
                key={index}
                className="bg-opacity-50 h-1 flex-1 overflow-hidden rounded-full bg-gray-600"
              >
                <div
                  className="h-full rounded-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                ></div>
              </div>
            ))}
          </div>

          <div className="absolute top-10 right-4 left-4 z-20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {contact?.avatar ? (
                <img
                  src={contact?.avatar}
                  alt={displayName}
                  className="h-10 w-10 rounded-full border-2 border-blue-500/50 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-500/50 bg-[#06234f]">
                  <span className="text-lg font-bold text-blue-400">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{displayName}</p>
                <p className="text-sm text-blue-300/70">
                  {formatTimestamp(currentStatus?.timestamp)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="rounded-full bg-black/20 p-2 text-white transition-all hover:bg-black/40 cursor-pointer"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <FaPlay className="h-4 w-4" /> : <FaPause className="h-4 w-4" />}
              </button>

              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="rounded-full bg-black/20 p-2 text-white transition-all hover:bg-black/40 cursor-pointer"
                  >
                    <FaEllipsisV className="h-4 w-4" />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-32 rounded-lg bg-[#06234f] p-1 shadow-xl border border-blue-500/20 z-50"
                      >
                        <button
                          onClick={handleDeleteClick}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={onClose}
                className="rounded-full bg-black/20 p-2 text-white transition-all hover:bg-black/40 hover:text-blue-400 cursor-pointer"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex h-full w-full items-center justify-center bg-black/40">
            {currentStatus?.contentType === "text" ? (
              <div className="p-8 text-center text-white">
                <p className="text-3xl font-medium">{currentStatus?.media}</p>
              </div>
            ) : currentStatus?.contentType === "image" ? (
              <img
                src={currentStatus?.media}
                alt="image"
                className="max-h-full max-w-full object-contain"
              />
            ) : currentStatus?.contentType === "video" ? (
              <video
                src={currentStatus?.media}
                controls
                muted
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
            ) : null}
          </div>



          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="absolute top-1/2 left-4 -translate-y-2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 hover:text-blue-400 cursor-pointer"
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
          )}

          {currentIndex < contact?.statuses?.length - 1 && (
            <button
              onClick={onNext}
              className="absolute top-1/2 right-4 -translate-y-2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 hover:text-blue-400 cursor-pointer"
            >
              <FaChevronRight className="h-5 w-5" />
            </button>
          )}

          {isOwner && (
            <div className="absolute right-4 bottom-4 left-4">
              <button
                onClick={handleViewersToggle}
                className="flex w-full items-center justify-between rounded-lg bg-black/60 px-4 py-3 text-white backdrop-blur-md transition-all hover:bg-black/80 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FaEye className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold">{currentStatus?.viewers?.length || 0} views</span>
                </div>

                <FaChevronDown
                  className={`h-4 w-4 text-blue-400 transition-transform ${showViewers ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-[#06234f]/90 p-4 backdrop-blur-md border border-blue-800/30 sidebar-scrollbar"
                   > 
                   {loading ? (
                    <p className="text-center text-blue-300">Loading Viewers...</p>
                   ) : currentStatus?.viewers?.length > 0 ? (
                     <div className="space-y-3">
                      {currentStatus?.viewers?.map((viewer) => {
                        const viewerName = user?.contactMappings?.[viewer?.phoneNumber] || viewer?.fullName || "Unknown";
                        return (
                          <div key={viewer?._id} className="flex items-center space-x-3">
                            {viewer?.profilePicture ? (
                              <img src={viewer?.profilePicture} alt={viewerName} className="h-8 w-8 rounded-full border border-blue-500/30 object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-[#020818]">
                                <span className="text-sm font-bold text-blue-400">
                                  {viewerName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-white">{viewerName}</span>
                          </div>
                        );
                      })}
                     </div>
                   ) : (
                     <p className="text-center text-blue-300/70">No viewers yet</p>
                   )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {/* Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-sm rounded-2xl bg-[#05164a] p-6 shadow-2xl border border-blue-500/20"
                >
                  <h3 className="text-lg font-bold text-white mb-2">Delete Status?</h3>
                  <p className="text-blue-300/70 text-sm mb-6">Are you sure you want to delete this status? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default StatusPreview;
