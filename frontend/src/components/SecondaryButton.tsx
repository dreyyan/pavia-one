interface PrimaryButtonProps {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
    iconSrc?: string;
    iconPosition?: "left" | "right";
}

const SecondaryButton: React.FC<PrimaryButtonProps> = ({
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
            className="flex justify-center items-center gap-1 w-full py-3 rounded-md cursor-pointer bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)] transition-all duration-200 disabled:opacity-50"
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

export default SecondaryButton;