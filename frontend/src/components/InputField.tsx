import { useState, type CSSProperties } from "react";

interface InputFieldProps {
  label?: string;
  sublabel?: string;
  type?: string;
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
  max?: number;
  required?: boolean;
  readOnly?: boolean;
}

const InputField = ({
  label,
  sublabel,
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
  readOnly = false,
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = () => {
    if (disabled || readOnly) return;
    const event = { target: { value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  const togglePasswordVisibility = () => {
    if (disabled) return;
    setShowPassword((prev) => !prev);
  };

  let passwordIcon = "";
  if (showPassword) {
    passwordIcon = isHovered
      ? "/visibility-off-hovered-icon.svg"
      : "/visibility-off-icon.svg";
  } else {
    passwordIcon = isHovered
      ? "/visibility-hovered-icon.svg"
      : "/visibility-icon.svg";
  }

  const numberInputStyle: CSSProperties = {
    MozAppearance: "textfield",
    WebkitAppearance: "none",
  };

  const baseClasses = `w-full rounded-lg border py-2 focus:outline-none font-roboto transition-colors duration-150 ${
    iconSrc ? "pl-10" : "px-3"
  } ${
    disabled
      ? "bg-[var(--color-text-50)] border-[var(--color-text-200)] text-[var(--color-text-400)] cursor-not-allowed"
      : readOnly
      ? "bg-[var(--color-text-50)] border-[var(--color-text-50)] text-[var(--color-text-600)] cursor-default focus:ring-0"
      : "bg-white border-[var(--color-text-300)] text-[var(--color-text-900)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-200)]"
  }`;

  if (type === "checkbox") {
    return (
      <div className="flex justify-between items-center gap-2">
        {label && (
          <label className="text-[var(--color-text-900)]">
            {label} {required && <span className="text-[var(--color-red-700)]">*</span>}
          </label>
        )}

        <input
          type="checkbox"
          checked={value as boolean}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          disabled={disabled || readOnly}
          className={`h-5 w-5 ${disabled || readOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
        />

        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="input-field-label text-[var(--color-text-900)] truncate whitespace-nowrap overflow-hidden">
          {label} {required && <span className="text-[var(--color-red-700)]">*</span>}
        </label>
      )}

      {sublabel && (
        <label className="text-xs font-roboto text-[var(--color-text-600)]">
          {sublabel}
        </label>
      )}

      <div className="relative">
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

        {type === "select" ? (
          <select
            value={value as string}
            onChange={onChange}
            disabled={disabled || readOnly}
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
              if (disabled || readOnly) return;

              let val = e.target.value;

              if (type === "number") {
                if (val.startsWith("-")) val = val.slice(1);
                val = val.replace(/[^\d]/g, "");

                if (maxLength && val.length > maxLength) val = val.slice(0, maxLength);
                if (max !== undefined && Number(val) > max) val = String(max);

                const event = {
                  ...e,
                  target: { ...e.target, value: val },
                } as React.ChangeEvent<HTMLInputElement>;

                onChange(event);
                return;
              }

              onChange(e);
            }}
            placeholder={disabled || readOnly ? "" : placeholder}
            disabled={disabled}
            readOnly={readOnly}
            style={numberInputStyle}
            className={`${baseClasses} ${
              type === "number"
                ? "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                : ""
            }`}
            {...(type === "number" && max !== undefined ? { max } : {})}
          />
        )}

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
        ) : showClear &&
          value &&
          !disabled &&
          !readOnly &&
          type !== "date" &&
          type !== "select" &&
          type !== "number" ? (
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