import { useState } from "react";

interface InputFieldProps {
  label?: string;
  type?: string; // "text", "number", "password", "date", or "select"
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  iconSrc?: string;
  iconAlt?: string;
  showClear?: boolean;
  disabled?: boolean;
  options?: string[]; // for dropdown/select
  max?: number; // maximum value for number input
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
  options = [],
  max,
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
  const togglePasswordVisibility = () => {
    if (disabled) return;
    setShowPassword((prev) => !prev);
  };

  // Password icon
  let passwordIcon = "";
  if (showPassword) {
    passwordIcon = isHovered ? "/visibility-off-hovered-icon.svg" : "/visibility-off-icon.svg";
  } else {
    passwordIcon = isHovered ? "/visibility-hovered-icon.svg" : "/visibility-icon.svg";
  }

  // Remove number input arrows
  const numberInputStyle =
    type === "number"
      ? { MozAppearance: "textfield", WebkitAppearance: "none" }
      : undefined;

  const baseClasses = `w-full rounded-lg border-2 py-2 focus:outline-none focus:ring-0 font-roboto ${
    iconSrc ? "pl-10" : "px-3"
  } ${
    disabled
      ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-[var(--color-bg-50)] border-[var(--color-bg-800)] text-[var(--color-text-900)]"
  }`;

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

        {/* Input or Select */}
        {type === "select" ? (
          <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${baseClasses} appearance-none font-roboto`}
          >
            <option value="" disabled>{placeholder || "Select an option"}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            value={value}
            onChange={(e) => {
              let val = e.target.value;

              if (type === "number") {
                // Remove leading "-" to prevent negative values
                if (val.startsWith("-")) val = val.slice(1);

                // Remove non-digit characters
                val = val.replace(/[^\d]/g, "");

                // Enforce maxLength if provided
                if (maxLength && val.length > maxLength) val = val.slice(0, maxLength);

                // Enforce max if provided
                if (max !== undefined && Number(val) > max) val = String(max);

                // Trigger onChange with sanitized number
                const event = { ...e, target: { ...e.target, value: val } } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
                return;
              }

              // For other input types, just forward the event
              onChange(e);
            }}
            placeholder={placeholder}
            disabled={disabled}
            style={numberInputStyle}
            className={`${baseClasses} ${type === "number" ? "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : ""}`}
            {...(type === "number" && max !== undefined ? { max } : {})}
          />
        )}

        {/* Right button: password toggle OR clear */}
        {type === "password" && value ? (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
            className={`absolute inset-y-0 right-0 flex items-center justify-center pb-1 pl-3 pr-4 h-full ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            <img
              src={passwordIcon}
              alt={showPassword ? "Hide password" : "Show password"}
              className="size-6 pt-1 object-contain"
            />
          </button>
        ) : showClear && value && !disabled && type !== "date" && type !== "select" && type !== "number" ? (
          <button
            type="button"
            onClick={handleClear}
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