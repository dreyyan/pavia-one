import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarLinkProps {
  icon: string;          // default icon (e.g., dashboard-black.svg)
  hoverIcon?: string;    // hover icon (e.g., dashboard-hover.svg)
  text: string;
  to: string;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, hoverIcon, text, to, onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === to;
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate(to);
    if (onClick) onClick();
  };

  // Determine text color dynamically
  const textColor = isActive || isHovered
    ? "var(--color-primary-700)"
    : "var(--color-text-800)";

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        flex items-center gap-3 p-2 rounded w-full text-left cursor-pointer
        transition-colors duration-200
        ${isActive ? "bg-[var(--color-primary-100)]" : ""}
        ${isHovered && !isActive ? "bg-[var(--color-primary-50)]" : ""}
      `}
    >
      <img
        src={isHovered || isActive ? hoverIcon || icon : icon}
        alt={`${text} icon`}
        className="w-5 h-5"
      />
      <h3 style={{ color: textColor }} className={`font-medium transition-colors duration-200`}>
        {text}
      </h3>
    </button>
  );
};

export default SidebarLink;