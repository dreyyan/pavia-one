import { useState, type CSSProperties } from "react";

interface InputFieldProps {
  label?: string;
  type?: string; // "text", "number", "password", "date", "select", or "checkbox"
  value: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  iconSrc?: string;
  iconAlt?: string;
  showClear?: boolean;
  disabled?: boolean;
  options?: string[];
  max?: number; // maximum value for number input
  required?: boolean;
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
  required = false,
}: InputFieldProps) => {
  // [STATES]
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // [HANDLE] Clear input field
  const handleClear = () => {
    if (disabled) return;
    const event = { target: { value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  // [HANDLE] Toggle password visibility
  const togglePasswordVisibility = () => {
    if (disabled) return;
    setShowPassword((prev) => !prev);
  };

  // [LOGIC] Determine password icon path
  let passwordIcon = "";
  if (showPassword) {
    passwordIcon = isHovered ? "/visibility-off-hovered-icon.svg" : "/visibility-off-icon.svg";
  } else {
    passwordIcon = isHovered ? "/visibility-hovered-icon.svg" : "/visibility-icon.svg";
  }

  // [STYLE] Remove number input arrows
  const numberInputStyle: CSSProperties = {
    MozAppearance: "textfield",
    WebkitAppearance: "none",
  };

  // [STYLE] Base classes for input fields
  const baseClasses = `w-full rounded-lg border-1 py-2 focus:outline-none focus:ring-0 font-roboto ${
    iconSrc ? "pl-10" : "px-3"
  } ${
    disabled
      ? "bg-[var(--color-bg-50)] border-[var(--color-text-50)] text-[var(--color-text-700)] cursor-not-allowed"
      : "bg-[var(--color-bg-50)] border-[var(--color-text-300)] text-[var(--color-text-950)]"
  }`;

  // [CHECKBOX] Special layout: label left, checkbox right
  if (type === "checkbox") {
    return (
      <div className="flex justify-between items-center gap-2">
        {/* [UI] Label */}
        {label && (
          <label className="text-[var(--color-text-900)]">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        {/* [UI] Checkbox */}
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          disabled={disabled}
          className={`h-5 w-5 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        />

        {/* [UI] Error */}
        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* [UI] Label */}
      {label && (
        <label className="input-field-label text-[var(--color-text-900)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* [UI] Left Icon */}
        {iconSrc && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <img
              src={`/${iconSrc}`}
              alt={iconAlt}
              loading="eager"
              className="w-5 h-5 object-contain"
            />
          </div>
        )}

        {/* [UI] Dropdown or Input */}
        {type === "select" ? (
          <select
            value={value as string}
            onChange={onChange}
            disabled={disabled}
            className={`${baseClasses} appearance-none font-roboto`}
          >
            <option value="" disabled>
              {placeholder || "Select an option"}
            </option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            value={value as string | number}
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
                const event = {
                  ...e,
                  target: { ...e.target, value: val },
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
                return;
              }

              // Forward event for other input types
              onChange(e);
            }}
            placeholder={placeholder}
            disabled={disabled}
            style={numberInputStyle}
            className={`${baseClasses} ${
              type === "number"
                ? "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                : ""
            }`}
            {...(type === "number" && max !== undefined ? { max } : {})}
          />
        )}

        {/* [RIGHT BUTTON] password toggle or clear */}
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

      {/* [UI] Error */}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default InputField;