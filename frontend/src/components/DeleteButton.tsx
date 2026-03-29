interface DeleteButtonProps {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  text = "Delete",
  onClick,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex justify-center items-center gap-1 w-full py-3 rounded-md cursor-pointer bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)] transition-all duration-200 disabled:opacity-50"
    >
      <img src="/delete-icon-white.svg" className="size-4" />
      <p className="button text-white">{text}</p>
    </button>
  );
};

export default DeleteButton;