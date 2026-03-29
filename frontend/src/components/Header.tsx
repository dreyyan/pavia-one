import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLink from "./SidebarLink";

const Header = () => {
  const navigate = useNavigate();

  // [STATES]
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Safely read role from localStorage
  const storedRole = localStorage.getItem("role");
  const [role, setRole] = useState<"Adviser" | "Admin" | "">(
    storedRole === "Admin" || storedRole === "Adviser" ? storedRole : ""
  );

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));

  // [HANDLE] Toggle sidebar 
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // [HANDLE] Close sidebar
  const closeSidebar = () => setIsSidebarOpen(false);

  // [HANDLE] Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setRole("");
    navigate("/");
  };

  // Safe role path for URLs
  const rolePath = role ? role.toLowerCase() : "admin";

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-[var(--color-primary-700)]">
        {isLoggedIn && (
          <button onClick={toggleSidebar} className="w-8 h-8 cursor-pointer">
            <img src="/burger-menu-icon.svg" alt="Burger Menu Icon" />
          </button>
        )}

        <button onClick={() => navigate("/")} className="cursor-pointer">
          <img src="/pavia-one-banner-white.svg" className="h-7" alt="Logo" />
        </button>
      </header>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-80
          bg-[var(--color-bg-100)] shadow-xl z-50
          transform transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center bg-[var(--color-primary-700)] shadow-md px-5 py-6 gap-x-4">
          <div>
            <h2 className="mb-2 text-[var(--color-text-50)]">John Doe</h2>
            <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">
              Grade 10 - Section A
            </p>
            <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">
              Class Adviser
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col p-4 gap-1">
          <SidebarLink
            icon="/dashboard-icon.svg"
            text="Dashboard"
            to={`/${rolePath}/dashboard`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/class-management-icon.svg"
            text="Class Management"
            to={`/${rolePath}/classes`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/school-forms-icon.svg"
            text="School Forms"
            to={`/${rolePath}/school-forms`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/transfer-dropout-monitoring-icon.svg"
            text="Transfer / Dropout Monitoring"
            to={`/${rolePath}/transfer`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/reports-and-statistics-icon.svg"
            text="Reports & Statistics"
            to={`/${rolePath}/reports`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/announcements-and-events-icon.svg"
            text="Announcements and Events"
            to={`/announcements-and-events`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/profile-icon.svg"
            text="Profile"
            to={`/${rolePath}/profile`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/settings-icon.svg"
            text="Settings"
            to={`/${rolePath}/settings`}
            onClick={closeSidebar}
          />
          <SidebarLink
            icon="/logout-icon.svg"
            text="Logout"
            to={`/login/${rolePath}`}
            onClick={() => { closeSidebar(); handleLogout(); }}
          />
        </nav>
      </aside>
    </>
  );
};

export default Header;