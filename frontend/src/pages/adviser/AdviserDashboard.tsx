import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import DashboardSkeleton from "../../components/DashboardSkeleton";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdviserDashboard = () => {
  const navigate = useNavigate();

  // * Auth & Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = unknown

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!data.success) {
          console.error("Profile fetch error:", data.message);
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setProfile(data.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/login/adviser");
    }
  }, [isAuthenticated, navigate]);

  // Show skeleton while loading or validating token
  if (loading || isAuthenticated === null) return <DashboardSkeleton />;

  return (
    <div className="py-6 px-4 space-y-4">
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">Dashboard</h1>
      </div>

      {/* Personal Information */}
      <div className="flex items-center bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-4 shadow-md">
        <div className="bg-[var(--color-bg-200)] size-18 rounded-full"></div>
        <div>
          <h2 className="mb-2">{profile?.name}</h2>
          <p className="font-roboto font-semibold text-sm">
            Grade {profile?.gradeLevel} - Section {profile?.sectionName}
          </p>
          <p className="font-roboto font-medium text-xs">Class Adviser</p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
        <div className="space-y-2">
          <DashboardItem iconSrc="/class-size-icon.svg" text="Class Size" value={profile?.classSize || 0} />
          <DashboardItem iconSrc="/present-today-icon.svg" text="Present Today" value={profile?.presentToday || 0} />
          <DashboardItem iconSrc="/pending-tasks-icon.svg" text="Pending Tasks" value={profile?.pendingTasks || 0} />
        </div>
      </div>

      {/* Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-6 px-4">
        <DashboardButton iconSrc="/view-students-icon.svg" text="View Students" color="#0066CC" />
        <DashboardButton iconSrc="/attendance-icon.svg" text="Attendance" color="#28A428" />
        <DashboardButton iconSrc="/grades-icon.svg" text="Grades" color="#CA8E02" />
        <DashboardButton iconSrc="/reports-icon.svg" text="Reports" color="#8F28A4" />
      </div>
    </div>
  );
};

export default AdviserDashboard;