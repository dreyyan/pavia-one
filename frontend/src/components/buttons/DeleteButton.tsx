interface DeleteButtonProps {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  text = "Delete",
  onClick,
  disabled,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex justify-center items-center gap-1 px-4 md:px-8 h-10 rounded-md cursor-pointer 
        bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)] 
        transition-all duration-200 disabled:opacity-50 whitespace-nowrap ${className}`}
    >
      <img 
        src="/delete.svg" 
        className="size-4 sm:size-5" 
        alt="Delete icon" 
      />
      <span className="button text-[var(--color-text-50)]">{text}</span>
    </button>
  );
};

export default DeleteButton;