// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";

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
  isAdvisory: boolean;
}

interface Profile {
  name: string;
  sections: Section[];
  presentToday?: number;
  pendingTasks?: number;
}

const AdviserDashboard = () => {
  // [STATES]
  const { setShowTokenExpiredModal } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // [EFFECT] Preload all assets
  useEffect(() => {
    const assetsToPreload = [
      "/class-size-icon.svg",
      "/present-today-icon.svg",
      "/pending-tasks-icon.svg",
      "/view-students-icon.svg",
      "/attendance-icon.svg",
      "/grades-icon.svg",
      "/reports-icon.svg",
    ];

    let loadedCount = 0;
    assetsToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === assetsToPreload.length) {
          setMediaLoaded(true);
        }
      };
    });
  }, []);

  // *[EFFECT] Fetch adviser's profile
  useEffect(() => {
    const token = localStorage.getItem("token");

    // ![ERROR] Non-existing token
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

        // ![ERROR] Expired token
        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        // ![ERROR] Backend failure response
        if (!data.success) {
          console.error("Profile fetch error:", data.message);
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        // *[SUCCESS] Fetch user profile from backend
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

  // [LOADING STATE] Wait for profile fetch and media preload
  if (loading || !mediaLoaded) return <Skeleton />;

  // Get advisory section and class size
  const advisorySection = profile?.sections?.find((s) => s.isAdvisory);
  const classSize = advisorySection?.classSize ?? 0;

  return (
    <div className="py-6 px-4 space-y-4">
      {/* [UI] Page Title */}
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">Dashboard</h1>
      </div>

      {/* [SECTION] Personal Information */}
      <div className="flex items-center bg-[var(--color-primary-600)] border-2 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md">

        {/* [UI] Profile Picture Placeholder */}
        <div className="bg-[var(--color-bg-200)] size-18 rounded-full flex-shrink-0"></div>

        {/* [COMPONENT] Profile Information */}
        <div className="flex-1">
          {/* [UI] Name */}
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">
            {profile?.name}
          </p>

          {advisorySection ? (
            <>
              {/* [UI] Grade and Section */}
              <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">
                Grade {advisorySection.gradeLevel} — {advisorySection.name}
              </p>
              {/* [UI] Role */}
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">
                Class Adviser
              </p>
            </>
          ) : (
            // ![ERROR] No advisory section
            <p className="text-[var(--color-red-600)] font-semibold text-sm">
              You are not assigned to any advisory section.
            </p>
          )}
        </div>
      </div>

      {/* [SECTION] Section Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 gap-x-3 shadow-md">
        {/* [UI] Overview */}
        <h2 className="mb-3">Overview</h2>

        {/* [SECTION] Dashboard Information */}
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
      <div className="grid grid-cols-2 gap-6 px-4">
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