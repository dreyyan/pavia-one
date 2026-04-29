import { BadgeColor, BadgeVariant } from "../../types";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  color?: BadgeColor;
};

const colorMap: Record<BadgeVariant, BadgeColor> = {
  primary: "primary",
  secondary: "secondary",
  accent: "accent",

  success: "green",
  warning: "orange",
  danger: "red",
  info: "blue",

  neutral: "secondary",
};

const Badge = ({ label, variant = "primary", color }: BadgeProps) => {
  const finalColor = color ?? colorMap[variant];

  return (
    <span
      className="px-2 py-0.5 text-xs md:text-sm font-semibold rounded-full border"
      style={{
        backgroundColor: `var(--color-${finalColor}-50)`,
        color: `var(--color-${finalColor}-600)`,
        borderColor: `var(--color-${finalColor}-200)`,
      }}
    >
      {label}
    </span>
  );
};

export default Badge;