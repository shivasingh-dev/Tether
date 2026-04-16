import { format } from "date-fns";
import React, { useRef, useState } from "react";
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile,
  FaRegTrashAlt,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import useOutsideClick from "../../hooks/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { Check, CheckCheck } from "lucide-react";

const MessageBubble = ({
  message,
  theme,
  currentUser,
  onReact,
  deleteMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setshowReactions] = useState(false);
  const messageRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const optionRef = useRef(null);

  const emojiPickerRef = useRef(null);
  const reactionMenuRef = useRef(null);
  const isUserMessage = message?.sender?._id === currentUser?._id;

  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === "dark" ? "bg-[#144de8] text-white" : "bg-[#d9fdd3] text-black"}`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === "dark" ? "bg-[#144de8] text-white" : "bg-[#d9fdd3] text-black"} `;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setshowReactions(false);
  };

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  useOutsideClick(reactionMenuRef, () => {
    if (showReactions) setshowReactions(false);
  });

  useOutsideClick(optionRef, () => {
    if (showOptions) setShowOptions(false);
  });

  if (message === 0) return;

  return (
    <div
      className={`flex ${
        message.reactions && message.reactions.length > 0 ? "mb-5" : "mb-1.5"
      } ${isUserMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative group max-w-[75%] ${isUserMessage ? "items-end" : "items-start"} flex flex-col`}
        ref={messageRef}
      >
        {/* ── Message Bubble ── */}
        <div onClick={()  => console.log("Deleting message with ID:", message?._id)}
          className={`relative px-3 py-1.5 min-w-20 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.2)]
          ${
            isUserMessage
              ? "bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
              : "bg-[#06234f] text-blue-50 border border-blue-900/30 rounded-bl-sm"
          }`}
        >
          {/* Text Content */}
          {message.contentType === "text" && (
            <div className="relative">
              <p className="text-[14.5px] leading-[1.3] wrap-break-word whitespace-pre-wrap">
                {message.content}
                <span className="inline-block w-12 h-1" aria-hidden="true">
                  &#8203;
                </span>
              </p>
            </div>
          )}

          {/* Image Content */}
          {message.contentType === "image" && (
            <div className="relative pb-5">
              {" "}
              <img
                src={message.imageOrVideoUrl}
                alt="media"
                className="rounded-xl max-w-xs border border-blue-900/20 object-cover"
              />
              {message.content && (
                <p className="text-[14px] leading-relaxed mt-1 wrap-break-word">
                  {message.content}
                  <span className="inline-block w-16.25 h-1" aria-hidden="true">
                    &#8203;
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Video Content */}
          {message.contentType === "video" && (
            <div className="relative pb-5">
              {" "}
              <video
                src={message.imageOrVideoUrl}
                alt="media"
                controls
                className="rounded-xl max-w-xs border border-blue-900/20 object-cover"
              />
              {message.content && (
                <p className="text-[14px] leading-relaxed mt-1 wrap-break-word">
                  {message.content}
                  <span className="inline-block w-16.25 h-1" aria-hidden="true">
                    &#8203;
                  </span>
                </p>
              )}
            </div>
          )}

          {/*  Time + Status */}
          <div className="absolute bottom-1 right-2 flex items-center justify-end gap-1 pointer-events-none">
            <span
              className={`text-[10px] font-medium leading-none ${isUserMessage ? "text-blue-100/80" : "text-blue-300/60"}`}
            >
              {format(new Date(message.createdAt), "HH:mm")}
            </span>
            {isUserMessage && (
              <div className="flex items-center -mb-px">
                {message.messageStatus === "sent" && (
                  <Check
                    size={15}
                    strokeWidth={4}
                    className="text-blue-200/70"
                  />
                )}
                {message.messageStatus === "delivered" && (
                  <CheckCheck size={15} className="text-blue-200/70" />
                )}
                {message.messageStatus === "read" && (
                  <CheckCheck
                    size={15}
                    className="text-[#38bdf8] drop-shadow-[0_0_2px_rgba(56,189,248,0.5)]"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/*  Hover Options & Reaction Buttons (Outside Bubble) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10
          ${isUserMessage ? "-left-16 flex-row-reverse" : "-right-16 flex-row"}`}
        >
          {/* Reaction Button */}
          <button
            onClick={() => setshowReactions(true)}
            className="p-1.5 rounded-full bg-[#06234f] border border-blue-900/50 hover:bg-[#0a1f44] cursor-pointer shadow-md transition-all hover:scale-105"
          >
            <FaSmile size={13} className="text-blue-300" />
          </button>

          {/* 3 Dot Options Button */}
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className="p-1.5 rounded-full bg-[#06234f] border border-blue-900/50 hover:bg-[#0a1f44] cursor-pointer shadow-md transition-all hover:scale-105"
          >
            <HiDotsVertical size={13} className="text-blue-300" />
          </button>
        </div>

        {/* Quick Reactions Menu */}
        {showReactions && (
          <div
            ref={reactionMenuRef}
            className={`absolute -top-10 ${isUserMessage ? "right-0" : "left-0"}
              flex items-center bg-[#0a1f44] border border-blue-800/50
              rounded-full px-2 py-1.5 gap-1 shadow-[0_8px_25px_rgba(0,0,0,0.6)] z-50 animate-in fade-in zoom-in duration-200`}
          >
            {quickReactions.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 hover:-translate-y-1 transition-transform cursor-pointer p-1 text-[18px]"
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-5 bg-blue-900/60 mx-1" />
            <button
              onClick={() => {
                setShowEmojiPicker(true);
                setshowReactions(false);
              }}
              className="p-1.5 rounded-full hover:bg-[#06234f] cursor-pointer transition-colors"
            >
              <FaPlus size={12} className="text-blue-300" />
            </button>
          </div>
        )}

        {/*  Full Emoji Picker  */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`absolute ${isUserMessage ? "right-0" : "left-0"} bottom-12 z-50 shadow-2xl`}
          >
            <div className="relative rounded-lg overflow-hidden border border-blue-800/50">
              <EmojiPicker
                onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                theme="dark"
                width={300}
                height={400}
              />
            </div>
          </div>
        )}

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute z-20 flex items-center -bottom-4.25
              ${isUserMessage ? "right-2.5" : "left-2.5"}`}
          >
            <div
              className="flex items-center gap-0.5 px-1.5 py-1
                bg-[#1e293b] border-0.5 border-[#020818]
                shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
              style={{ borderRadius: "100px" }}
            >
              {message.reactions.slice(0, 3).map((reaction, index) => (
                <span key={index} style={{ fontSize: "12px", lineHeight: "1" }}>
                  {reaction.emoji}
                </span>
              ))}
              {message.reactions.length > 1 && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "#90a4be",
                    fontWeight: "600",
                  }}
                >
                  {message.reactions.length}
                </span>
              )}
            </div>
          </div>
        )}

        {/*  Options Menu */}
        {showOptions && (
          <div
            ref={optionRef}
            className={`absolute z-50 w-36 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] bg-[#0a1f44] border border-blue-800/50 animate-in fade-in zoom-in duration-200
            ${isUserMessage ? "right-0" : "left-0"} bottom-2.5 translate-y-full mb-2  group-last:bottom-full group-last:top-auto group-last:mb-2 group-last:translate-y-0`}
          >
            <button
              onClick={() => {
                if (message.contentType === "text") {
                  navigator.clipboard.writeText(message.content);
                }
                setShowOptions(false);
              }}
              className="flex items-center w-full px-4 py-2.5 gap-3 cursor-pointer
        text-[13px] text-blue-100 hover:bg-[#06234f] transition-colors"
            >
              <FaRegCopy size={13} className="text-blue-400" />
              <span>Copy</span>
            </button>

            {isUserMessage && (
              <>
                <div className="border-t border-blue-900/50" />
                <button
                  onClick={() => {
                    deleteMessage(message?._id);
                    setShowOptions(false);
                  }}
                  className="flex items-center w-full px-4 py-2.5 gap-3 cursor-pointer
            text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <FaRegTrashAlt size={13} className="text-red-400" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
