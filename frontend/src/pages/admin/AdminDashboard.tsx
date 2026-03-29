// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import Skeleton from "../../components/Skeleton";

// ? [INTERFACES]
interface Profile {
  id: number;
  name: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardSummary {
  adminProfile: Profile;
  totalStudents: number;
  totalAdvisers: number;
  totalSections: number;
  totalAdmins: number;
}

const AdminDashboard = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // [STATES]
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAdvisers, setTotalAdvisers] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [loading, setLoading] = useState(true);

  // * [EFFECT] Fetch dashboard summary
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data: { success: boolean; data: DashboardSummary } = await res.json();
        console.log("Fetched dashboard summary:", data);

        // ![ERROR] Backend failure response
        if (!data.success) {
          console.error("Profile fetch error:", data);
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        // Map backend response
        setProfile(data.data.adminProfile);
        setTotalStudents(data.data.totalStudents);
        setTotalAdvisers(data.data.totalAdvisers);
        setTotalSections(data.data.totalSections);
        setTotalAdmins(data.data.totalAdmins);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
        localStorage.removeItem("token");
        setShowTokenExpiredModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [setShowTokenExpiredModal]);

  if (loading) return <Skeleton />;

  return (
    <div className="py-6 px-4 space-y-4">
      {/* [UI] Dashboard */}
      <h1 className="text-[var(--color-text-800)]">Dashboard</h1>

      {/* [SECTION] Personal Info */}
      <div className="relative flex items-center bg-[var(--color-bg-100)] rounded-lg px-5 py-4 gap-x-4 shadow-md">
        <div className="absolute top-3 right-3 space-x-1">
          {/* [BUTTON] Profile */}
          <button className="p-2 rounded-sm bg-[var(--color-secondary-500)] cursor-pointer">
            <img src="/profile-icon-white.svg" alt="Admin Profile" className="w-4 h-4" />
          </button>

          {/* [BUTTON] Settings */}
          <button className="p-2 rounded-sm bg-[var(--color-bg-300)] cursor-pointer">
            <img src="/settings-icon-white.svg" alt="Admin Profile" className="w-4 h-4" />
          </button>

          {/* [BUTTON] Logout */}
          <button className="p-2 rounded-sm bg-[var(--color-red-600)] cursor-pointer">
            <img src="/logout-icon-white.svg" alt="Admin Profile" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1">
          <h2 className="font-roboto font-extrabold mb-2 text-[var(--color-text-800)]">
            {profile?.name}
          </h2>
          <p className="body-large text-[var(--color-text-800)]">
            Administrator
          </p>
        </div>
      </div>

      {/* [SECTION] Dashboard Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
        <div className="space-y-2">
          <DashboardItem iconSrc="/total-students-icon.svg" text="Total Students" value={totalStudents} />
          <DashboardItem iconSrc="/total-advisers-icon.svg" text="Total Advisers" value={totalAdvisers} color="007FFF" />
          <DashboardItem iconSrc="/total-sections-icon.svg" text="Total Sections" value={totalSections} />
          <DashboardItem iconSrc="/total-admin-icon.svg" text="Total Admins" value={totalAdmins} color="007FFF" />
        </div>
      </div>

      {/* [SECTION] Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-6 px-4">
        <DashboardButton
          iconSrc="/students-dashboard-icon.svg"
          text="Students"
          color="#0066CC"
          to={"/admin/students"}
        />
        <DashboardButton
          iconSrc="/advisers-dashboard-icon.svg"
          text="Advisers"
          color="#8F28A4"
          to={"/admin/advisers"}
        />
        <DashboardButton
          iconSrc="/sections-dashboard-icon.svg"
          text="Sections"
          color="#CA8E02"
          to={"/admin/sections"}
        />
        <DashboardButton
          iconSrc="/subjects-dashboard-icon.svg"
          text="Subjects"
          color="#28A428"
          to={"/admin/subjects"}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;