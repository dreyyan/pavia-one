// [IMPORT] Hooks
import React from "react";

// [IMPORT] Types
import type { Announcement } from "../../../types";

interface AnnouncementCardProps {
  announcement: Announcement;
  formatDate: (dateStr?: string) => string;
  onClick: (announcement: Announcement) => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  formatDate,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(announcement)}
      className="bg-[var(--color-bg-50)] border border-[var(--color-text-300)] p-4 rounded-lg shadow-lg cursor-pointer hover:bg-[var(--color-bg-100)] transition-colors duration-150"
    >
      {/* [TEXT] Publish date */}
      <p className="body-small text-[var(--color-text-400)] mb-1">
        {formatDate(announcement.publishedAt)}
      </p>

      {/* [TEXT] Title */}
      <p className="font-figtree font-bold lg:font-extrabold text-[var(--color-text-800)] leading-tight">
        {announcement.title}
      </p>

      {/* [TEXT] Content preview */}
      {announcement.content && (
        <p className="text-[var(--color-text-700)] text-sm mt-1 line-clamp-2">
          {announcement.content}
        </p>
      )}
    </div>
  );
};

export default AnnouncementCard;