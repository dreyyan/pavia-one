// [IMPORT] Hooks
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers
import { darkenColor } from "../../helpers";

interface DashboardButtonProps {
  iconSrc?: string;
  text: string;
  color: string;
  to?: string;
  disabled?: boolean;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({
  iconSrc,
  text,
  color,
  to,
  disabled,
}) => {
  const navigate = useNavigate();

  // [HANDLE] Navigate to link
  const handleClick = () => {
    if (disabled) return;
    if (to) navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      style={{ backgroundColor: color }}
      className={`flex flex-col justify-center items-center aspect-square rounded-lg shadow-md 
        transition-all duration-200 w-full overflow-hidden
        xl:flex-row xl:aspect-auto xl:justify-start xl:items-center xl:gap-6 xl:px-8 xl:py-6
        ${disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        }
      `}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = darkenColor(color, 0.15);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = color;
        }
      }}
    >
      {/* [UI] Icon */}
      {iconSrc && (
        <img
          src={iconSrc}
          className="size-16 sm:size-20 md:size-22 lg:size-24 xl:size-20 2xl:size-24 flex-shrink-0"
          alt={text}
        />
      )}

      {/* [TEXT] Button Label */}
      <p className="font-roboto font-bold text-sm sm:text-md md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-[var(--color-text-50)] mt-2 xl:mt-0 text-center xl:text-left">
        {text}
      </p>
    </button>
  );
};

export default DashboardButton;