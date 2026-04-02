import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLink from "./SidebarLink";

interface AdminProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const Header = () => {
  const navigate = useNavigate();

  // [STATES]
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Safely read role from localStorage and normalize to lowercase
  const storedRole = localStorage.getItem("role")?.toLowerCase();
  const validRoles = ["admin", "adviser"] as const;
  const [role, setRole] = useState<"admin" | "adviser" | "">(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storedRole && validRoles.includes(storedRole as any)
      ? (storedRole as "admin" | "adviser")
      : ""
  );

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));

  // [STATE] Admin profile (fetched from API)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

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

  // [EFFECT] Fetch admin profile if role is admin
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (role === "admin") {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/admin/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          if (json.success) {
            setAdminProfile(json.data);
          } else {
            console.error(json.message);
          }
        } catch (err) {
          console.error("Failed to fetch admin profile:", err);
        }
      }
    };

    fetchAdminProfile();
  }, [role]);

  // [DATA] Sidebar header info based on role
  const sidebarHeader = role === "adviser"
    ? { name: "John Doe", info1: "Grade 10 - Section A", info2: "Class Adviser" }
    : role === "admin"
    ? { name: adminProfile?.name || "Admin User", info1: "Administrator", info2: "" }
    : { name: "", info1: "", info2: "" };

  // [DATA] Define menu items for each role (keys in lowercase)
  const menuItems: Record<string, { iconBase: string; text: string; to: string }[]> = {
    adviser: [
      { iconBase: "dashboard", text: "Dashboard", to: "/adviser/dashboard" },
      { iconBase: "class-management", text: "Class Management", to: "/adviser/classes" },
      { iconBase: "school-forms", text: "School Forms", to: "/adviser/school-forms" },
      { iconBase: "transfer-dropout-monitoring", text: "Transfer / Dropout Monitoring", to: "/adviser/transfer" },
      { iconBase: "reports-and-statistics", text: "Reports & Statistics", to: "/adviser/reports" },
      { iconBase: "announcements-and-events", text: "Announcements & Events", to: "/announcements-and-events" },
      { iconBase: "profile", text: "Profile", to: "/adviser/profile" },
      { iconBase: "settings", text: "Settings", to: "/adviser/settings" },
      { iconBase: "logout", text: "Logout", to: "/login/adviser" },
    ],
    admin: [
      { iconBase: "dashboard", text: "Dashboard", to: "/admin/dashboard" },
      { iconBase: "students", text: "Students", to: "/admin/students" },
      { iconBase: "advisers", text: "Advisers", to: "/admin/advisers" },
      { iconBase: "sections", text: "Sections", to: "/admin/sections" },
      { iconBase: "subjects", text: "Subjects", to: "/admin/subjects" },
      { iconBase: "school-forms", text: "School Forms", to: "/admin/school-forms" },
      { iconBase: "transfer-dropout-monitoring", text: "Transfer / Dropout Monitoring", to: "/admin/transfer" },
      { iconBase: "reports-and-statistics", text: "Reports & Statistics", to: "/admin/reports" },
      { iconBase: "announcements-and-events", text: "Announcements & Events", to: "/admin/announcements-and-events" },
      { iconBase: "profile", text: "Profile", to: "/admin/profile" },
      { iconBase: "settings", text: "Settings", to: "/admin/settings" },
      { iconBase: "logout", text: "Logout", to: "/login/admin" },
    ],
  };

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-[var(--color-primary-700)]">
        {isLoggedIn && (
          <button onClick={toggleSidebar} className="w-8 h-8 cursor-pointer">
            <img src="/burger-menu-icon.svg" alt="Burger Menu Icon" />
          </button>
        )}

        <button onClick={() => navigate("/admin/dashboard")} className="cursor-pointer">
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
            <h2 className="mb-2 text-[var(--color-text-50)]">{sidebarHeader.name}</h2>
            <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">{sidebarHeader.info1}</p>
            {sidebarHeader.info2 && (
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">{sidebarHeader.info2}</p>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col p-4 gap-1">
          {role && menuItems[role].map((item) => (
            <SidebarLink
              key={item.text}
              icon={`/${item.iconBase}-black.svg`}
              hoverIcon={`/${item.iconBase}-hover.svg`}
              text={item.text}
              to={item.to}
              onClick={() => {
                closeSidebar();
                if (item.text === "Logout") handleLogout();
              }}
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Header;