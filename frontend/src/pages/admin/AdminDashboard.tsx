// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import DashboardSkeleton from "../../components/DashboardSkeleton";

// ? [INTERFACES]
interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  classSize: number;
  isAdvisory: boolean;
}

interface Profile {
  name: string;
  sections: Section[];
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
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // [EFFECT] Preload assets
  useEffect(() => {
    const assetsToPreload = [
      "/class-size-icon.svg",
      "/present-today-icon.svg",
      "/pending-tasks-icon.svg",
      "/view-students-icon.svg",
      "/attendance-icon.svg",
      "/grades-icon.svg",
      "/reports-icon.svg",
      "/total-students-icon.svg",
      "/total-advisers-icon.svg",
      "/total-sections-icon.svg",
      "/total-admin-icon.svg",
    ];

    let loadedCount = 0;
    assetsToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === assetsToPreload.length) setMediaLoaded(true);
      };
    });
  }, []);

// [EFFECT] Fetch dashboard summary
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowTokenExpiredModal(true);
      setLoading(false);
      return;
    }

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

  if (loading || !mediaLoaded) return <DashboardSkeleton />;

  return (
    <div className="py-6 px-4 space-y-4">
      {/* [UI] Dashboard */}
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">Dashboard</h1>
      </div>

      {/* [SECTION] Personal Info */}
      <div className="flex items-center bg-[var(--color-primary-600)] border-2 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-4 gap-x-4 shadow-md">
        <div className="flex-1">
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">
            {profile?.name}
          </p>
          <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">
            Admin
          </p>
        </div>
      </div>

      {/* [SECTION] Dashboard Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
        <div className="space-y-2">
          <DashboardItem iconSrc="/total-students-icon.svg" text="Total Students" value={totalStudents} />
          <DashboardItem iconSrc="/total-advisers-icon.svg" text="Total Advisers" value={totalAdvisers} />
          <DashboardItem iconSrc="/total-sections-icon.svg" text="Total Sections" value={totalSections} />
          <DashboardItem iconSrc="/total-admin-icon.svg" text="Total Admin" value={totalAdmins} />
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