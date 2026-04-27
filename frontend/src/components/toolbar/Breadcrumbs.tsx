import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers
import { formatBreadcrumbName } from "../../helpers";

export interface BreadcrumbItem {
  label: string;
  path: string | null;
  isName?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  title?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, title }) => {
  const navigate = useNavigate();

  return (
    <div>
      {title && (
        <span className="breadcrumb-header leading-0">{title}</span>
      )}

      <nav className="font-roboto text-xs sm:text-sm md:text-base lg:text-lg text-[var(--color-text-700)] flex flex-wrap items-center gap-1">
        {items.map((crumb, idx) => {
          const label = crumb.isName
            ? formatBreadcrumbName(crumb.label)
            : crumb.label;

          return (
            <span key={idx} className="flex items-center gap-1">
              {crumb.path ? (
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => navigate(crumb.path!)}
                >
                  {label}
                </span>
              ) : (
                <span className="font-semibold text-[var(--color-text-800)]">
                  {label}
                </span>
              )}

              {idx < items.length - 1 && (
                <span className="text-[var(--color-text-500)]">/</span>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
};

export default Breadcrumbs;