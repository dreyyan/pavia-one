import React from "react";

interface AdminPageLayoutProps {
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  header,
  toolbar,
  children,
  footer,
  className = "",
}) => {
  return (
    <div className={`py-10 px-4 space-y-4 relative ${className}`}>
      {header && <div>{header}</div>}

      {toolbar && <div>{toolbar}</div>}

      <div>{children}</div>

      {footer && <div>{footer}</div>}
    </div>
  );
};

export default AdminPageLayout;