// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import Skeleton from "../../components/Skeleton";

// ? [INTERFACES]
interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  classSize: number;
}

interface Profile {
  name: string;
  sections: Section[];
  advisorySection?: Section | null;
  presentToday?: number;
  pendingTasks?: number;
}

const AdviserDashboard = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // * [EFFECT] Fetch adviser's profile
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found in localStorage");
      setShowTokenExpiredModal(true);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log("Fetching profile with token:", token ? "Token exists (length: " + token.length + ")" : "No token");

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          method: "GET",
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json" 
          },
        });

        console.log("Profile response status:", res.status);

        if (res.status === 401) {
          console.warn("401 received - token rejected by backend");
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        if (!data.success) {
          console.error("Backend error:", data.message);
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

  if (loading) return <Skeleton />;

  // Get advisory section and class size
  const advisorySection = profile?.advisorySection;
  const classSize = advisorySection?.classSize ?? 0;

  return (
    <div className="py-10 px-4 space-y-4">
      {/* [UI] Dashboard */}
      <h1 className="text-[var(--color-text-800)]">Dashboard</h1>

      {/* [SECTION] Profile */}
      <div className="relative flex items-center bg-[var(--color-bg-100)] rounded-lg px-4 py-3 gap-x-4 shadow-md">
        {/* [SECTION] Profile Buttons */}
        <div className="absolute top-3 right-3 space-x-1">
          {/* [BUTTON] Profile */}
          <button 
            onClick={() => navigate("/adviser/profile")} 
            className="p-2 rounded-sm bg-[var(--color-secondary-500)] cursor-pointer"
          >
            <img src="/profile-icon-white.svg" alt="Adviser Profile" className="w-4 h-4" />
          </button>

          {/* [BUTTON] Settings */}
          <button 
            onClick={() => navigate("/adviser/settings")} 
            className="p-2 rounded-sm bg-[var(--color-bg-500)] cursor-pointer"
          >
            <img src="/settings-icon-white.svg" alt="Settings" className="w-4 h-4" />
          </button>

          {/* [BUTTON] Logout */}
          <button 
            onClick={() => navigate("/login/adviser")} 
            className="p-2 rounded-sm bg-[var(--color-red-700)] cursor-pointer"
          >
            <img src="/logout-icon-white.svg" alt="Logout" className="w-4 h-4" />
          </button>
        </div>

        {/* [SECTION] Profile Information */}
        <div className="flex-1 space-y-3 flex flex-col">
          <h2 className="font-roboto font-extrabold text-[var(--color-text-800)]">
            {profile?.name}
          </h2>

          {advisorySection ? (
            <div className="flex flex-col">
              <p className="font-roboto font-xs leading-3 font-medium text-[var(--color-text-800)]">
                Grade {advisorySection.gradeLevel} - {advisorySection.name}
              </p>
              <p className="body-default text-sm text-[var(--color-text-700)]">
                Class Adviser
              </p>
            </div>
          ) : (
            <p className="text-[var(--color-red-600)] font-semibold text-sm">
              You are not assigned to any advisory section.
            </p>
          )}
        </div>
      </div>

      {/* [SECTION] Dashboard Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>

        <div className="space-y-2">
          <DashboardItem
            iconSrc="/class-size-icon.svg"
            text="Class Size"
            value={classSize}
          />
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

      {/* [SECTION] Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-6 px-6">
        <DashboardButton
          iconSrc="/view-students-dashboard.svg"
          text="View Students"
          color="#0066CC"
          to={advisorySection ? `/adviser/classes/${advisorySection.id}/students` : "#"}
        />
        <DashboardButton
          iconSrc="/grades-dashboard.svg"
          text="Grades"
          color="#CA8E02"
          to={advisorySection ? `/adviser/classes/grades/${advisorySection.id}` : "#"}
        />
        <DashboardButton
          iconSrc="/reports-dashboard.svg"
          text="Reports"
          color="#8F28A4"
        />
        <DashboardButton
          iconSrc="/school-forms-dashboard.svg"
          text="School Forms"
          color="#28A428"
          to={advisorySection ? `/adviser/school-forms/${advisorySection.id}` : "#"}
        />
      </div>
    </div>
  );
};

export default AdviserDashboard;