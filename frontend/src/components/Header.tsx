import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLink from "./SidebarLink";

const Header = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [role, setRole] = useState<"Adviser" | "Admin" | "">(() => {
      return (localStorage.getItem("role") as "Adviser" | "Admin") || "";
    });

    const [isLoggedIn, setIsLoggedIn] = useState(() => {
      return !!localStorage.getItem("token");
    });
    const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);

    const handleApiResponse = async (res: Response) => {
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return null; // indicate failure
      }
      const data = await res.json();
      return data;
    };

    // [HANDLE] Toggle sidebar 
    const toggleSidebar = () => { setIsSidebarOpen(prev => !prev); };

    // [HANDLE] Close the sidebar
    const closeSidebar = () => setIsSidebarOpen(false);

    // [HANDLE] Logout
    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      setIsLoggedIn(false);
      setRole("");

      navigate("/");
    };

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
          fixed top-0 left-0 h-full w-82
          bg-[var(--color-bg-100)] shadow-xl z-50
          transform transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* [SECTION] Sidebar Header */}
        <div className="flex items-center bg-[var(--color-primary-700)] shadow-md px-5 py-6 gap-x-4">
            {/* Profile Image */}
            <div className="bg-[var(--color-bg-200)] size-18 rounded-full"></div>

            {/* Profile Details */}
            <div className="">
                <h2 className="mb-2 text-[var(--color-text-50)]">John Doe</h2>
                <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">Grade 10 - Section A</p>
                <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">Class Adviser</p>
            </div>
        </div>

        {/* [SECTION] Menu Items */}
        <nav className="flex flex-col p-4 gap-1">
        <SidebarLink icon="/dashboard-icon.svg" text="Dashboard" to={`/${role.toLowerCase()}/dashboard`} onClick={closeSidebar} />
        <SidebarLink icon="/class-management-icon.svg" text="Class Management" to={`/${role.toLowerCase()}/classes`} onClick={closeSidebar} />
        <SidebarLink icon="/grade-encoding-icon.svg" text="Grade Encoding" to={`/${role.toLowerCase()}/grades`} onClick={closeSidebar} />
        <SidebarLink icon="/school-forms-icon.svg" text="School Forms" to={`/${role.toLowerCase()}/school-forms`} onClick={closeSidebar} />
        <SidebarLink icon="/transfer-dropout-monitoring-icon.svg" text="Transfer / Dropout Monitoring" to={`/${role.toLowerCase()}/transfer`} onClick={closeSidebar} />
        <SidebarLink icon="/reports-and-statistics-icon.svg" text="Reports & Statistics" to={`/${role.toLowerCase()}/reports`} onClick={closeSidebar} />
        <SidebarLink icon="/notifications-and-events-icon.svg" text="Notifications and Events" to={`/${role.toLowerCase()}/notifications`} onClick={closeSidebar} />
        <SidebarLink icon="/profile-icon.svg" text="Profile" to={`/${role.toLowerCase()}/profile`} onClick={closeSidebar} />
        <SidebarLink icon="/settings-icon.svg" text="Settings" to={`/${role.toLowerCase()}/settings`} onClick={closeSidebar} />
        {/* Logout */}
        <SidebarLink
          icon="/logout-icon.svg"
          text="Logout"
          to={`/login/${role.toLowerCase()}`}
          onClick={() => {
            closeSidebar();
            handleLogout();
          }}
        />
        </nav>
      </aside>
      {showTokenExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 text-center space-y-4 shadow-lg">
            <h2 className="text-lg font-bold">Session Expired</h2>
            <p>Your session has expired. Please log in again.</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-white rounded-md font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;