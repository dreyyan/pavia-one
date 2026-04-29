import React from "react";

type AvatarColor =
  | "primary"
  | "secondary"
  | "accent"
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "purple"
  | "red"
  | "neutral";

interface AvatarProps {
  initials: string;
  color?: AvatarColor;
}

const colorStyles: Record<AvatarColor, string> = {
  primary:
    "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]",
  secondary:
    "bg-[var(--color-secondary-50)] text-[var(--color-secondary-700)] border-[var(--color-secondary-200)]",
  accent:
    "bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border-[var(--color-accent-200)]",
  blue:
    "bg-[var(--color-blue-50)] text-[var(--color-blue-700)] border-[var(--color-blue-200)]",
  green:
    "bg-[var(--color-green-50)] text-[var(--color-green-700)] border-[var(--color-green-200)]",
  orange:
    "bg-[var(--color-orange-50)] text-[var(--color-orange-700)] border-[var(--color-orange-200)]",
  violet:
    "bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border-[var(--color-violet-200)]",
  purple:
    "bg-[var(--color-purple-50)] text-[var(--color-purple-700)] border-[var(--color-purple-200)]",
  red:
    "bg-[var(--color-red-50)] text-[var(--color-red-600)] border-[var(--color-red-200)]",
  neutral:
    "bg-[var(--color-bg-100)] text-[var(--color-text-600)] border-[var(--color-bg-300)]",
};

const Avatar: React.FC<AvatarProps> = ({
  initials,
  color = "neutral",
}) => {
  return (
    <div
      className={`size-10 rounded-md flex items-center justify-center font-bold text-xl border flex-shrink-0 ${colorStyles[color]}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;