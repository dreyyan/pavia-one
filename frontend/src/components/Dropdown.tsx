import React, { useRef, useEffect } from "react";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  icon: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  options: DropdownOption[];
  selected: string;
  onSelect: (value: string) => void;
  width?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  icon,
  label,
  isOpen,
  onToggle,
  options,
  selected,
  onSelect,
  width = "w-40",
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center justify-center sm:justify-start gap-2 text-[var(--color-text-50)] rounded-sm px-3 sm:px-4 md:px-5 h-10 transition cursor-pointer ${
          isOpen ? "bg-[var(--color-bg-50)]" : "bg-[var(--color-bg-50)] hover:opacity-80"
        }`}
      >
        <img src={icon} alt={label} className="size-4 sm:size-5" />
        <span className="hidden sm:inline text-xs font-roboto font-medium text-[var(--color-text-700)]">
          {label}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 ${width} bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                onToggle();
              }}
              className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                selected === opt.value ? "bg-blue-100" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;