// [IMPORT] Libraries
import React from "react";

// [IMPORT] Sub-components
import EventBadge from "../../badges/EventBadge";

// [IMPORT] Constants & Types
import { EVENT_TYPE_LABELS, EVENT_TYPE_BADGE_MAP } from "../../../constants";
import type { SchoolEvent } from "../../../types";

interface EventCardProps {
  event: SchoolEvent;
  getEventDateDisplay: (event: SchoolEvent) => { month: string; day: string };
  onClick: (event: SchoolEvent) => void;
}

// [COMPONENT]
const EventCard: React.FC<EventCardProps> = ({
  event,
  getEventDateDisplay,
  onClick,
}) => {
  const { month, day } = getEventDateDisplay(event);

  return (
    <div
      onClick={() => onClick(event)}
      className="flex bg-[var(--color-bg-100)] border border-[var(--color-text-200)] rounded-lg overflow-hidden transition-all duration-150 ease-in-out hover:bg-[var(--color-bg-50)] cursor-pointer"
    >
      {/* [UI] Date badge */}
      <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-[var(--color-text-200)] min-w-[80px] bg-[var(--color-bg-50)]">
        <span className="text-xs text-[var(--color-text-500)] font-bold uppercase">
          {month}
        </span>
        <span className="text-2xl font-black text-[var(--color-text-800)]">
          {day}
        </span>
      </div>

      {/* [TEXT] Event info */}
      <div className="p-4 flex flex-col justify-center gap-1 flex-1 min-w-0">
        <p className="font-bold text-[var(--color-text-800)] text-sm leading-snug truncate">
          {event.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {/* [BADGE] Event type */}
          <EventBadge type={event.type} />

          {/* [BADGE] Online indicator */}
          {event.isOnline && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)]">
              Online
            </span>
          )}

          {/* [TEXT] Location */}
          {event.location && (
            <span className="text-xs text-[var(--color-text-500)] truncate">
              📍 {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;