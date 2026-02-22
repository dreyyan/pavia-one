interface InputFieldProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  iconSrc?: string; // path to image
  iconAlt?: string;
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  iconSrc,
  iconAlt = "icon",
}: InputFieldProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="input-field-label text-[var(--color-text-900)]">{label}</label>}

      <div className="relative">
        {iconSrc && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <img src={iconSrc} alt={iconAlt} className="w-5 h-5 object-contain" />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`focus:outline-none focus:ring-0 border-2 border-[var(--color-background-800)] rounded-lg py-2 ${
            iconSrc ? "pl-10" : "px-3"
          } w-full`}
        />
      </div>

      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default InputField;