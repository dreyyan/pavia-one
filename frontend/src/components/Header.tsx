import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLink from "./SidebarLink";

const Header = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [role, setRole] = useState<"Adviser" | "Admin">("Adviser");

    // [HANDLE] Toggle sidebar 
    const toggleSidebar = () => { setIsSidebarOpen(prev => !prev); };

    // [HANDLE] Close the sidebar
    const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 bg-[var(--color-primary-700)] text-white">
        
        {/* Burger Menu */}
        {isLoggedIn && (
          <button onClick={toggleSidebar} className="size-8 cursor-pointer">
            <img src="/burger-menu-icon.svg" alt="Burger Menu Icon" />
          </button>
        )}

        {/* Logo */}
        <button onClick={() => navigate("/")} className="cursor-pointer">
          <img src="/pavia-one-banner-white.svg" className="h-7" />
        </button>
      </header>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* [COMPONENT] Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-74
          bg-[var(--color-bg-100)] shadow-xl z-50
          transform transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* [SECTION] Sidebar Header */}
        <div className="flex items-center bg-[var(--color-bg-100)] shadow-md px-5 py-6 gap-x-4">
            {/* Profile Image */}
            <div className="bg-[var(--color-bg-200)] size-18 rounded-full"></div>

            {/* Profile Details */}
            <div className="">
                <h2 className="mb-2">John Doe</h2>
                <p className="font-roboto font-semibold text-sm">Grade 10 - Section A</p>
                <p className="font-roboto font-medium text-xs">Class Adviser</p>
            </div>
        </div>

        {/* [SECTION] Menu Items */}
        <nav className="flex flex-col p-4 gap-1">
        <SidebarLink icon="/dashboard-icon.svg" text="Dashboard" to={`/${role.toLowerCase()}/dashboard`} onClick={closeSidebar} />
        <SidebarLink icon="/class-management-icon.svg" text="Class Management" to={`/${role.toLowerCase()}/classes`} onClick={closeSidebar} />
        <SidebarLink icon="/grade-encoding-icon.svg" text="Grade Encoding" to={`/${role.toLowerCase()}/grades`} onClick={closeSidebar} />
        <SidebarLink icon="/school-registers-and-forms-icon.svg" text="School Registers & Forms" to={`/${role.toLowerCase()}/forms`} onClick={closeSidebar} />
        <SidebarLink icon="/transfer-dropout-monitoring-icon.svg" text="Transfer / Dropout Monitoring" to={`/${role.toLowerCase()}/transfer`} onClick={closeSidebar} />
        <SidebarLink icon="/reports-and-statistics-icon.svg" text="Reports & Statistics" to={`/${role.toLowerCase()}/reports`} onClick={closeSidebar} />
        <SidebarLink icon="/notifications-and-events-icon.svg" text="Notifications and Events" to={`/${role.toLowerCase()}/notifications`} onClick={closeSidebar} />
        <SidebarLink icon="/profile-icon.svg" text="Profile" to={`/${role.toLowerCase()}/profile`} onClick={closeSidebar} />
        <SidebarLink icon="/settings-icon.svg" text="Settings" to={`/${role.toLowerCase()}/settings`} onClick={closeSidebar} />
        </nav>
      </aside>
    </>
  );
};

export default Header;