import { useNavigate } from "react-router-dom";

interface DashboardButtonProps {
    iconSrc?: string;
    text: string;
    color: string;
    to?: string;
};

const DashboardButton: React.FC<DashboardButtonProps> = ({ iconSrc, text, color, to }) => {
    const navigate = useNavigate();

    // [HANDLE] Navigation
    const handleClick = () => {
        if (to) {
        navigate(to); // Navigate if 'to' prop is provided
        }
    };

    return (
        <button
        style={{backgroundColor: color}}
        onClick={handleClick}
        className="flex flex-col justify-center items-center aspect-square rounded-lg cursor-pointer transition-all duration-200 hover:opacity-80 shadow-md">
            {/* Icon */}
            <img src={iconSrc} className="size-16"/>

            {/* Text */}
            <p className="button text-[var(--color-text-50)]">{text}</p>
        </button>
    );
};

export default DashboardButton;