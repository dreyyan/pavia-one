interface DashboardIconButtonProps {
  iconSrc: string;
  alt: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "neutral" | "danger";
}

const variantStyles = {
  primary: "bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)]",
  neutral: "bg-[var(--color-bg-500)] hover:bg-[var(--color-bg-600)]",
  danger: "bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]",
};

const DashboardIconButton: React.FC<DashboardIconButtonProps> = ({
  iconSrc,
  alt,
  label,
  onClick,
  variant = "neutral",
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center lg:justify-start gap-2
        p-2 sm:p-2.5 md:p-3 lg:px-4 lg:py-3
        rounded-sm lg:rounded-md
        ${variantStyles[variant]}
        transition-colors duration-200 ease-in-out
        cursor-pointer
        lg:w-full
      `}
    >
      {/* [UI] Icon */}
      <img
        src={iconSrc}
        alt={alt}
        className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
      />

      {/* [TEXT] Label (hidden on mobile, shown on md) */}
      <span className="hidden sm:block font-roboto font-bold text-sm sm:text-sm xl:text-md 2xl:text-lg text-[var(--color-text-50)]">
        {label}
      </span>
    </button>
  );
};

export default DashboardIconButton;