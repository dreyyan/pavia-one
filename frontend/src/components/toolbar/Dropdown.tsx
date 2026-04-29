import React, { useRef, useEffect } from "react";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownGroup {
  label: string;
  options: DropdownOption[];
  selectedValues: string[];
  onSelectMultiple: (values: string[]) => void;
}

interface DropdownProps {
  icon: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  width?: string;
  // Single-select (original behaviour)
  options?: DropdownOption[];
  selected?: string;
  onSelect?: (value: string) => void;
  // Multi-select — flat list
  selectedValues?: string[];
  onSelectMultiple?: (values: string[]) => void;
  // Multi-select — grouped
  groups?: DropdownGroup[];
}

const Dropdown: React.FC<DropdownProps> = ({
  icon,
  label,
  isOpen,
  onToggle,
  options = [],
  selected,
  onSelect,
  selectedValues,
  onSelectMultiple,
  groups,
  width = "w-40",
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const isGrouped = groups !== undefined && groups.length > 0;
  const isMulti = !isGrouped && selectedValues !== undefined && onSelectMultiple !== undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMultiSelect = (
    value: string,
    currentValues: string[],
    setter: (v: string[]) => void
  ) => {
    const next = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setter(next);
  };

  const hasActiveFilter =
    isGrouped
      ? groups!.some(g => g.selectedValues.length > 0)
      : isMulti
      ? (selectedValues?.length ?? 0) > 0
      : selected !== undefined && selected !== "All" && selected !== "";

  const totalSelected = isGrouped
    ? groups!.reduce((sum, g) => sum + g.selectedValues.length, 0)
    : isMulti
    ? (selectedValues?.length ?? 0)
    : 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className="relative flex items-center justify-between gap-2 rounded-md px-3 sm:px-4 md:px-5 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80 overflow-visible"
      >
        <span className="hidden sm:inline text-xs font-roboto font-medium text-[var(--color-text-700)]">
          {label}
          {totalSelected > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-[10px] font-bold">
              {totalSelected}
            </span>
          )}
        </span>

        <img src={icon} alt={label} className="size-4 sm:size-5" />

        {hasActiveFilter && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--color-primary-500)] sm:hidden" />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 ${width} bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-hidden`}
        >
          {isGrouped ? (
            <div className="max-h-72 overflow-y-auto p-2 space-y-3">
              {groups!.map((group, gi) => (
                <div key={gi}>
                  <p className="text-[10px] font-roboto font-bold uppercase tracking-wide text-[var(--color-text-500)] px-2 mb-1">
                    {group.label}
                  </p>
                  {group.options.map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm text-[var(--color-text-900)]"
                    >
                      <input
                        type="checkbox"
                        checked={group.selectedValues.includes(opt.value)}
                        onChange={() =>
                          handleMultiSelect(opt.value, group.selectedValues, group.onSelectMultiple)
                        }
                        className="accent-[var(--color-primary-600)]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          ) : isMulti ? (
            <div className="p-2 space-y-1">
              {options.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm text-[var(--color-text-900)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues!.includes(opt.value)}
                    onChange={() =>
                      handleMultiSelect(opt.value, selectedValues!, onSelectMultiple!)
                    }
                    className="accent-[var(--color-primary-600)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSelect?.(opt.value);
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
      )}
    </div>
  );
};

export default Dropdown;