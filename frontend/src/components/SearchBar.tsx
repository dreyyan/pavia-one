import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onResetPage?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  onResetPage,
}) => {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          onResetPage?.();
        }}
        className="font-roboto font-medium text-xs sm:text-md w-full bg-[var(--color-bg-50)] rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
      />
    </div>
  );
};

export default SearchBar;