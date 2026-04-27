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

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const Badge = ({ label, color = "primary" }: BadgeProps) => {
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