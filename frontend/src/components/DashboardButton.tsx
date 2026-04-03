import { useNavigate } from "react-router-dom";
import { darkenColor } from "../helpers";

interface DashboardButtonProps {
    iconSrc?: string;
    text: string;
    color: string;
    to?: string;
    disabled?: boolean;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({ iconSrc, text, color, to, disabled }) => {
    const navigate = useNavigate();

    // [HANDLE] Navigation
    const handleClick = () => {
        if (disabled) return;
        if (to) navigate(to);
    };

    return (
        <button
            onClick={handleClick}
            style={{
                backgroundColor: color,
            }}
            className={`flex flex-col justify-center items-center aspect-square rounded-lg shadow-md transition-all duration-200
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            onMouseEnter={(e) => {
                if (!disabled) (e.currentTarget.style.backgroundColor = darkenColor(color, 0.15));
            }}
            onMouseLeave={(e) => {
                if (!disabled) (e.currentTarget.style.backgroundColor = color);
            }}
        >
            {/* Icon */}
            {iconSrc && <img src={iconSrc} className="size-16" />}

            {/* Text */}
            <p className="button text-[var(--color-text-50)]">{text}</p>
        </button>
    );
};

export default DashboardButton;