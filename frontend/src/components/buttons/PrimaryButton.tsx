interface PrimaryButtonProps {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
    iconSrc?: string;
    iconPosition?: "left" | "right";
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    text,
    onClick,
    disabled,
    color,
    iconSrc,
    iconPosition = "left",
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={color ? { backgroundColor: `#${color}` } : undefined}
            className="flex justify-center items-center gap-1 px-4 w-full h-10 rounded-md cursor-pointer bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-all duration-200 disabled:opacity-50"
        >
            {/* Render icon on the left */}
            {iconSrc && iconPosition === "left" && (
                <img src={iconSrc} className="size-4" />
            )}

            <p className="button text-white">{text}</p>

            {/* Render icon on the right */}
            {iconSrc && iconPosition === "right" && (
                <img src={iconSrc} className="size-4" />
            )}
        </button>
    );
};

export default PrimaryButton;