type BadgeColor =
  | "primary"
  | "secondary"
  | "accent"
  | "green"
  | "red"
  | "blue"
  | "orange"
  | "violet"
  | "purple";

type BadgeVariant =
| "primary"
| "success"
| "warning"
| "danger"
| "info"
| "neutral";

const colorMap: Record<BadgeVariant, BadgeColor> = {
  primary: "primary",
  success: "green",
  warning: "orange",
  danger: "red",
  info: "blue",
  neutral: "secondary",
};

const Badge = ({ label, variant = "primary" }: { label: string; variant?: BadgeVariant }) => {
  const color = colorMap[variant];

  return (
    <span
      className="px-2 py-0.5 text-xs md:text-sm font-semibold rounded-full border"
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

export default Badge;