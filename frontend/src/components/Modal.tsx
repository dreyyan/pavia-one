import { useState, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirmText?: string;          // optional, default "OK"
  inputValue?: string;
  onConfirm?: (value: string) => void;
  children?: React.ReactNode;    // optional content
  type?: "default" | "error" | "success" | "info" | "warning";
};

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "OK",
  inputValue = "",
  onConfirm,
  children,
  type = "default",
}: ModalProps) => {
  const [textInput, setTextInput] = useState(inputValue);

  // Reset input when modal closes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setTextInput(inputValue);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, inputValue]);

  if (!isOpen) return null;

  const borderColorClasses = {
    default: "border-t-blue-500",
    error:   "border-t-red-500",
    success: "border-t-green-500",
    info:    "border-t-blue-500",
    warning: "border-t-amber-500",
  };

  const textColorClasses = {
    default: "text-blue-700",
    error:   "text-red-700",
    success: "text-green-700",
    info:    "text-blue-700",
    warning: "text-amber-800",
  };

  const borderClass = borderColorClasses[type] || "border-t-blue-500";
  const textClass   = textColorClasses[type]   || "text-blue-700";

  // Optional: error-specific input styling
  const inputBorderClass = type === "error" ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }} // ← background stays inline (no issue here)
    >
      <div
        className={`
          bg-white rounded-xl shadow-xl w-full max-w-md p-6 sm:p-8 
          flex flex-col animate-fadeIn 
          border-t-4 ${borderClass}
        `}
      >
        {/* Header */}
        <h2 className={`text-xl sm:text-2xl font-semibold mb-4 ${textClass}`}>
          {title}
        </h2>

        {/* Body */}
        {children ? (
          <div className="mb-4">{children}</div>
        ) : (
          message && (
            <p
              className="text-sm sm:text-base mb-4"
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )
        )}

        {/* Optional input */}
        {onConfirm && children && (
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter value..."
            className={`
              w-full mb-4 px-4 py-2 border rounded-lg 
              focus:outline-none focus:ring-2 transition-shadow shadow-sm
              ${inputBorderClass}
            `}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-2 flex-wrap sm:flex-nowrap [&>button]:cursor-pointer">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm(textInput);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-white text-sm font-bold sm:text-base bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;