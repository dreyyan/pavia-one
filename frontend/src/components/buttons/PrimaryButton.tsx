interface PrimaryButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  iconSrc?: string;
  iconPosition?: "left" | "right";
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
      className={`flex justify-center items-center gap-1 px-4 md:px-8 h-10 rounded-md cursor-pointer bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-all duration-200 disabled:opacity-50 whitespace-nowrap ${className}`}
    >
      {iconSrc && iconPosition === "left" && (
        <img src={iconSrc} className="size-4 sm:size-5" />
      )}

      <span className="button text-[var(--color-text-50)] mr-1">{text}</span>

      {iconSrc && iconPosition === "right" && (
        <img src={iconSrc} className="size-4 sm:size-5" />
      )}
    </button>
  );
};

export default PrimaryButton;