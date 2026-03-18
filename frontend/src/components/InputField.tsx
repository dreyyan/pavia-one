import { useState } from "react";

interface InputFieldProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  iconSrc?: string; // path to image
  iconAlt?: string;
  showClear?: boolean; // show clear button for non-password fields
  disabled?: boolean;
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  iconSrc,
  iconAlt = "icon",
  showClear = true,
  disabled = false,
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle input clear
  const handleClear = () => {
    if (disabled) return;
    const event = { target: { value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // Dynamic input type
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  // Determine password icon
  let passwordIcon = "";
  if (showPassword) {
    passwordIcon = isHovered ? "/visibility-off-hovered-icon.svg" : "/visibility-off-icon.svg";
  } else {
    passwordIcon = isHovered ? "/visibility-hovered-icon.svg" : "/visibility-icon.svg";
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="input-field-label text-[var(--color-text-900)]">{label}</label>}

      <div className="relative">
        {/* Left icon */}
        {iconSrc && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <img src={`/${iconSrc}`} alt={iconAlt} loading="eager" className="w-5 h-5 object-contain" />
          </div>
        )}

        {/* Input */}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`focus:outline-none focus:ring-0 bg-[var(--color-bg-50)] border-2 border-[var(--color-bg-800)] rounded-lg py-2 ${
            iconSrc ? "pl-10" : "px-3"
          } w-full`}
        />

        {/* Right button: password visibility OR clear */}
        {type === "password" && value ? (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center justify-center pb-1 pl-3 pr-4 h-full cursor-pointer"
          >
            <img src={passwordIcon} alt={showPassword ? "Hide password" : "Show password"} className="size-6 pt-1 object-contain" />
          </button>
        ) : showClear && value && type !== "date" ? ( // <-- hide clear button for date type
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center justify-center pb-1 pl-3 pr-5 h-full font-bold text-md text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            &times;
          </button>
        ) : null}
      </div>

      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default InputField;