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
    <div className="flex justify-center items-center mt-6 gap-1.5 sm:gap-2 md:gap-3">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`flex items-center justify-center rounded-lg font-roboto font-bold transition-all duration-150 border active:scale-95
          w-8 h-8 text-sm
          sm:w-9 sm:h-9 
          md:w-10 md:h-10 md:text-base
          ${page === 1
            ? "bg-[var(--color-bg-400)] text-[var(--color-text-400)] cursor-not-allowed border-[var(--color-bg-400)]"
            : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-[var(--color-text-50)] border-transparent hover:border-[var(--color-primary-600)]"
          }`}
      >
        &lt;
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {getVisiblePages(page, totalPages).map((num, idx) =>
          num === "..." ? (
            <span
              key={`dots-${idx}`}
              className="flex items-center justify-center text-[var(--color-text-600)] font-medium
                w-8 h-8 text-sm
                sm:w-9 sm:h-9
                md:w-10 md:h-10"
            >
              ...
            </span>
          ) : (
            <button
              key={num}
              onClick={() => onPageChange(num as number)}
              className={`flex items-center justify-center rounded-lg font-bold transition-all duration-150 border active:scale-95
                w-8 h-8 text-sm
                sm:w-9 sm:h-9 
                md:w-10 md:h-10 md:text-base
                lg:w-11 lg:h-11
                ${num === page
                  ? "bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)] scale-105 shadow-sm"
                  : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)] hover:text-white border-transparent hover:border-[var(--color-primary-400)]"
                }`}
            >
              {num}
            </button>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`flex items-center justify-center rounded-lg font-roboto font-bold transition-all duration-150 border active:scale-95
          w-8 h-8 text-sm
          sm:w-9 sm:h-9 
          md:w-10 md:h-10 md:text-base
          ${page === totalPages
            ? "bg-[var(--color-bg-400)] text-[var(--color-text-400)] cursor-not-allowed border-[var(--color-bg-400)]"
            : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-[var(--color-text-50)] border-transparent hover:border-[var(--color-primary-600)]"
          }`}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;