import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getVisiblePages: (page: number, totalPages: number) => (number | "...")[];
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  getVisiblePages,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center mt-4 gap-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
          page === 1
            ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
            : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
        }`}
      >
        &lt;
      </button>

      <div className="flex items-center gap-2">
        {getVisiblePages(page, totalPages).map((num, idx) =>
          num === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-[var(--color-text-600)]">
              ...
            </span>
          ) : (
            <button
              key={num}
              onClick={() => onPageChange(num as number)}
              className={`size-6 flex items-center justify-center rounded-full font-bold text-xs transition-all duration-150 ${
                num === page
                  ? "size-7 bg-[var(--color-primary-500)] text-[var(--color-text-50)] scale-110"
                  : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)]"
              }`}
            >
              {num}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`size-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
          page === totalPages
            ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
            : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
        }`}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;