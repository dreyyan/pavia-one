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
      <img
        src="/search-icon.svg"
        alt="Search"
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          onResetPage?.();
        }}
        className="font-roboto font-medium text-xs sm:text-md w-full text-[var(--color-text-400)] bg-[var(--color-bg-50)] rounded-sm pl-10 pr-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-10"
      />
    </div>
  );
};

export default SearchBar;