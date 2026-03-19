import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import DashboardSkeleton from "../../components/DashboardSkeleton";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // modal context

const AdviserDashboard = () => {
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowTokenExpiredModal(true);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        if (!data.success) {
          console.error("Profile fetch error:", data.message);
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        setProfile(data.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        localStorage.removeItem("token");
        setShowTokenExpiredModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setShowTokenExpiredModal]);

  if (loading) return <DashboardSkeleton />;

  const advisorySection = profile?.sections?.find(s => s.isAdvisory);
  const classSize = advisorySection?.classSize ?? 0;

  return (
    <div className="py-6 px-4 space-y-4">
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">Dashboard</h1>
      </div>

      {/* Personal Information */}
      <div className="flex items-center bg-[var(--color-primary-600)] border-3 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md">
        {/* Profile Picture */}
        <div className="bg-[var(--color-bg-200)] size-18 rounded-full flex-shrink-0"></div>

        {/* Info Section */}
        <div className="flex-1">
          {/* Primary: Name */}
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">
            {profile?.name}
          </p>

          {advisorySection ? (
            <>
              {/* Secondary: Grade and Section */}
              <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">
                Grade {advisorySection.gradeLevel} — {advisorySection.name}
              </p>
              {/* Tertiary: Role */}
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">
                Class Adviser
              </p>
            </>
          ) : (
            <p className="text-red-600 font-semibold text-sm">
              You are not assigned to any advisory section.
            </p>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
        <div className="space-y-2">
          <DashboardItem iconSrc="/class-size-icon.svg" text="Class Size" value={classSize} />
          <DashboardItem
            iconSrc="/present-today-icon.svg"
            text="Present Today"
            value={profile?.presentToday || 0}
          />
          <DashboardItem
            iconSrc="/pending-tasks-icon.svg"
            text="Pending Tasks"
            value={profile?.pendingTasks || 0}
          />
        </div>
      </div>

      {/* Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-6 px-4">
        <DashboardButton
          iconSrc="/view-students-icon.svg"
          text="View Students"
          color="#0066CC"
          to={advisorySection ? `/adviser/classes/${advisorySection.id}/students` : "#"}
          disabled={!advisorySection}
        />
        <DashboardButton iconSrc="/attendance-icon.svg" text="Attendance" color="#28A428" />
        <DashboardButton iconSrc="/grades-icon.svg" text="Grades" color="#CA8E02" />
        <DashboardButton iconSrc="/reports-icon.svg" text="Reports" color="#8F28A4" />
      </div>
    </div>
  );
};

export default AdviserDashboard;