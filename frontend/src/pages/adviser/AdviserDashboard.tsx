// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

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

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: true,
    onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

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

        if (!data.data.advisorySection) {
          openGeneralModal({
            title: "No Advisory Section",
            message: "You do not have an advisory section assigned. Please contact the administrator.",
            type: "error",
            confirmText: "OK",
            isCancelable: false,
            onConfirm: () => {
              closeGeneralModal();
            }
          });
        }
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

  // [HANDLE] Logout
  const handleLogout = () => {
    openGeneralModal({
      title: "Confirm Logout",
      message: "Are you sure you want to log out of your account?",
      type: "info",
      confirmText: "Logout",
      isCancelable: true,
      onConfirm: () => {
        closeGeneralModal();
        navigate("/login/adviser");
      }
    });
  };

  if (loading) return <Skeleton />;

  // Get advisory section and class size
  const advisorySection = profile?.advisorySection;
  const classSize = advisorySection?.classSize ?? 0;

  return (
    <div className="py-10 px-4 space-y-4">
      {/* [MODAL] General */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
        isCancelable={generalModal.isCancelable}
      />

      {/* [UI] Dashboard */}
      <h1 className="text-[var(--color-text-800)]">Dashboard</h1>

      {/* [SECTION] Profile */}
      <div className="relative flex items-center bg-[var(--color-bg-100)] rounded-lg px-4 py-3 gap-x-4 shadow-md">
        {/* [SECTION] Profile Buttons */}
        <div className="absolute top-3 right-3 space-x-1">
          {/* [BUTTON] Profile */}
          <button onClick={() => {navigate("/adviser/profile")}} className="p-2 rounded-sm bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)] transition-colors duration-200 ease-in-out cursor-pointer">
            <img src="/profile-icon-white.svg" alt="Adviser Profile" className="w-4 h-4" />
          </button>

          {/* [BUTTON] Settings */}
          <button onClick={() => {navigate("/adviser/settings")}} className="p-2 rounded-sm bg-[var(--color-bg-500)] hover:bg-[var(--color-bg-600)] transition-colors duration-200 ease-in-out cursor-pointer">
            <img src="/settings-icon-white.svg" alt="Adviser Profile" className="w-4 h-4" />
          </button>

          {/* [BUTTON] Logout */}
          <button onClick={handleLogout} className="p-2 rounded-sm bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)] transition-colors duration-200 ease-in-out cursor-pointer">
            <img src="/logout-icon-white.svg" alt="Adviser Profile" className="w-4 h-4" />
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
            color="#0066CC"
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
          disabled={!advisorySection}
        />
        <DashboardButton
          iconSrc="/grades-dashboard.svg"
          text="Grades"
          color="#CA8E02"
          to={advisorySection ? `/adviser/classes/${advisorySection.id}/grades` : "#"}
          disabled={!advisorySection}
        />
        <DashboardButton
          iconSrc="/reports-dashboard.svg"
          text="Reports"
          color="#8F28A4"
          disabled={!advisorySection}
        />
        <DashboardButton
          iconSrc="/school-forms-dashboard.svg"
          text="School Forms"
          color="#28A428"
          to={advisorySection ? `/adviser/school-forms/${advisorySection.id}` : "#"}
          disabled={!advisorySection}
        />
      </div>
    </div>
  );
};

export default AdviserDashboard;