import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SidebarLinkProps {
  icon: string;          // default icon (e.g., dashboard-black.svg)
  hoverIcon?: string;    // hover icon (e.g., dashboard-hover.svg)
  text: string;
  to: string;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, hoverIcon, text, to, onClick }) => {
  const navigate = useNavigate();

  // [STATES] Current icon src for hover effect
  const [currentIcon, setCurrentIcon] = useState(icon);

  // [HANDLE] Click navigation link
  const handleClick = () => {
    navigate(to);
    if (onClick) onClick();
  };

  // [HANDLE] Hover enter
  const handleMouseEnter = () => {
    if (hoverIcon) setCurrentIcon(hoverIcon);
  };

  // [HANDLE] Hover leave
  const handleMouseLeave = () => {
    setCurrentIcon(icon);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-primary-50)] w-full text-left cursor-pointer"
    >
      <img src={currentIcon} alt={`${text} icon`} className="w-5 h-5" />
      <h3 className="text-[var(--color-text-800)] hover:text-[var(--color-primary-700)]">{text}</h3>
    </button>
  );
};

export default SidebarLink;