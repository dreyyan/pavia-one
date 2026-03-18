interface PrimaryButtonProps {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
}

const PrimaryButton = (props: PrimaryButtonProps) => {
    return (
        <button
            onClick={props.onClick}
            disabled={props.disabled}
            style={props.color ? { backgroundColor: `#${props.color}` } : undefined}
            className="w-full py-3 rounded-md cursor-pointer bg-[var(--color-primary-600)] transition-all duration-200 hover:opacity-80 disabled:opacity-50"
        >
            <p className="button text-white">{props.text}</p>
        </button>
    );
};

export default PrimaryButton;