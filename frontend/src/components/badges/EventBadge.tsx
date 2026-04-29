import React from "react";
import { EVENT_TYPE_LABELS, EVENT_TYPE_BADGE_MAP } from "../../constants";

type EventBadgeProps = {
  type: keyof typeof EVENT_TYPE_LABELS;
};

const EventBadge: React.FC<EventBadgeProps> = ({ type }) => {
  const label = EVENT_TYPE_LABELS[type];
  const color = EVENT_TYPE_BADGE_MAP[type] ?? "secondary";

  return (
    <span
      className="inline-block max-w-[140px] truncate px-2 py-0.5 text-xs font-semibold rounded-full border"
      style={{
        backgroundColor: `var(--color-${color}-50)`,
        color: `var(--color-${color}-600)`,
        borderColor: `var(--color-${color}-200)`,
      }}
    >
      {label}
    </span>
  );
};

export default EventBadge;