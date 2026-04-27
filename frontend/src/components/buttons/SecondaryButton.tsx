interface SecondaryButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  iconSrc?: string;
  iconPosition?: "left" | "right";
  className?: string;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  text,
  onClick,
  disabled,
  color,
  iconSrc,
  iconPosition = "left",
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={color ? { backgroundColor: `#${color}` } : undefined}
      className={`flex justify-center items-center gap-1 md:gap-2 px-4 md:px-5 h-10 rounded-md cursor-pointer bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)]  transition-all duration-200 disabled:opacity-50 whitespace-nowrap ${className}`}
    >
      {/* Left Icon */}
      {iconSrc && iconPosition === "left" && (
        <img src={iconSrc} className="size-4 sm:size-5" alt="" />
      )}

      <span className="button text-[var(--color-text-50)]">{text}</span>

      {/* Right Icon */}
      {iconSrc && iconPosition === "right" && (
        <img src={iconSrc} className="size-4 sm:size-5" alt="" />
      )}
    </button>
  );
};

export default SecondaryButton;