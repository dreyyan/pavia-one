import React from "react";

interface AdminPageLayoutProps {
  header?: React.ReactNode;
  card?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  header,
  card,
  toolbar,
  children,
  footer,
  className = "",
}) => {
  return (
    <div className={`py-10 sm:py-12 md:py-14 lg:py-16 xl:py-18 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 relative ${className}`}>
      {header && <div>{header}</div>}

      {card && <div>{card}</div>}

      {toolbar && <div>{toolbar}</div>}

      <div>{children}</div>

      {footer && <div>{footer}</div>}
    </div>
  );
};

export default AdminPageLayout;