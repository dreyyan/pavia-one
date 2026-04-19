import React from "react";
import { useNavigate } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  path: string | null;
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

      <nav className="font-roboto text-sm text-[var(--color-text-700)] flex flex-wrap items-center gap-1">
        {items.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {crumb.path ? (
              <span
                className="cursor-pointer hover:underline"
                onClick={() => navigate(crumb.path!)}
              >
                {crumb.label}
              </span>
            ) : (
              <span className="font-semibold text-[var(--color-text-800)]">
                {crumb.label}
              </span>
            )}

            {idx < items.length - 1 && (
              <span className="text-[var(--color-text-500)]">/</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumbs;