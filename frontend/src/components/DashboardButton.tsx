interface DashboardButtonProps {
    iconSrc?: string;
    text: string;
    color: string;
};

const DashboardButton: React.FC<DashboardButtonProps> = ({iconSrc, text, color}) => {
    return (
        <button
        style={{backgroundColor: color}}
        className="flex flex-col justify-center items-center aspect-square rounded-lg cursor-pointer transition-all duration-200 hover:opacity-80">
            {/* Icon */}
            <img src={iconSrc} className="size-16"/>

            {/* Text */}
            <p className="button text-[var(--color-text-50)]">{text}</p>
        </button>
    );
};

export default DashboardButton;