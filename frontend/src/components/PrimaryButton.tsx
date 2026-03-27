interface PrimaryButtonProps {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
    iconSrc?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ text, onClick, disabled, color, iconSrc }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={color ? { backgroundColor: `#${color}` } : undefined}
            className="flex justify-center gap-x-1 w-full py-3 rounded-md cursor-pointer bg-[var(--color-primary-600)] transition-all duration-200 hover:opacity-80 disabled:opacity-50"
        >
            {iconSrc && (
                <img src={iconSrc} />
            )}
            <p className="button text-white">{text}</p>
        </button>
    );
};

export default PrimaryButton;