import React from 'react';
import formatTimestamp from '@/Utils/data';
import useUserStore from '@/Store/useUserStore';
import { motion } from 'motion/react';

const StatusList = ({contact, onPreview, theme}) => {
  const { user } = useUserStore();
  const displayName = user?.contactMappings?.[contact?.phoneNumber] || contact?.name || "Unknown";

  return (
    <motion.div
      onClick={onPreview}
      className={`mx-4 my-1 flex cursor-pointer items-center rounded-xl p-2.5 transition-all border border-transparent hover:border-blue-800/30 hover:bg-[#06234f]/60 cursor-pointer`}
    >
      {/* Avatar Section */}
      <div className="relative shrink-0">
        {contact?.avatar ? (
          <img
            src={contact.avatar}
            className="h-12 w-12 rounded-full border border-blue-500/20 object-cover"
            alt="profile"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-[#06234f]">
            <span className="text-xl font-bold text-blue-400">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <svg
          className="absolute top-0 left-0 h-12 w-12"
          viewBox="0 0 100 100"
        >
          {contact?.statuses?.map((_, index) => {
            const total = contact?.statuses?.length || 1;
            const circumference = 2 * Math.PI * 48;
            const gap = total > 1 ? 6 : 0;
            const segmentLength = (circumference - gap * total) / total;
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
      </div>

      <div className="ml-3 min-w-0 flex-1">
        <h2 className="truncate text-[16px] font-medium text-white">
          {displayName}
        </h2>
        <p className="text-[13px] text-blue-300/70">
          {formatTimestamp(contact?.statuses?.[contact?.statuses?.length - 1]?.timestamp)}
        </p>
      </div>
    </motion.div>
  );
};

export default StatusList;
