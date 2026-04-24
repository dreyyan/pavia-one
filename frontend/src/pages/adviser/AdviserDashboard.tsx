/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import DashboardButton from "../../components/buttons/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import DashboardIconButton from "../../components/buttons/DashboardIconButton";
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";

// [IMPORT] Types
import { GeneralModalConfig, AdviserProfile } from "../../types";

const AdviserDashboard = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES] Entities
  const [profile, setProfile] = useState<AdviserProfile | null>(null);
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

  // * [EFFECT] Fetch adviser profile
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
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        if (!data.success) {
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
            onConfirm: () => closeGeneralModal(),
          });
        }
      } catch (err) {
        // ! [ERROR] Fetching profile failed
        console.error("Failed to fetch profile:", err);
        localStorage.removeItem("token");
        setShowTokenExpiredModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
      },
    });
  };

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  const advisorySection = profile?.advisorySection;

  return (
    <div className="py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-10 md:px-16 space-y-3 sm:space-y-6 md:space-y-9">
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

      <div className="lg:flex lg:flex-row-reverse gap-x-3 sm:gap-x-6 md:gap-x-9 space-y-3 sm:space-y-6 md:space-y-9">

        {/* [SECTION] Profile */}
        <div className="relative flex lg:flex-2 lg:flex-col-reverse items-center lg:items-end bg-[var(--color-bg-100)] rounded-lg px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-x-3 sm:gap-x-4 shadow-md">

          {/* [SECTION] Profile Buttons */}
          <div className="
            absolute top-3 right-3
            flex lg:flex-col
            items-center lg:items-stretch
            gap-1 sm:gap-2 md:gap-3
            lg:static lg:w-full
          ">
            <DashboardIconButton
              iconSrc="/profile.svg"
              alt="Adviser Profile"
              label="Profile"
              onClick={() => navigate("/adviser/profile")}
              variant="primary"
            />
            <DashboardIconButton
              iconSrc="/settings.svg"
              alt="Adviser Settings"
              label="Settings"
              onClick={() => navigate("/adviser/settings")}
              variant="neutral"
            />
            <DashboardIconButton
              iconSrc="/logout.svg"
              alt="Adviser Logout"
              label="Logout"
              onClick={handleLogout}
              variant="danger"
            />
          </div>

          <hr className="hidden lg:block w-full border-t border-[var(--color-bg-400)] my-4" />

          {/* [SECTION] Profile Information */}
          <div className="flex-1 lg:pt-2">
            <p className="lg:text-end font-roboto font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl text-[var(--color-text-800)]">
              {profile?.name}
            </p>
            {advisorySection ? (
              <>
                <p className="lg:text-end font-roboto font-semibold text-sm sm:text-md md:text-lg lg:text-md xl:text-xl text-[var(--color-text-700)]">
                  Grade {advisorySection.gradeLevel} — {advisorySection.name}
                </p>
                <p className="lg:text-end font-roboto font-medium text-sm text-[var(--color-text-600)]">
                  Class Adviser
                </p>
              </>
            ) : (
              <p className="lg:text-end font-roboto text-sm text-[var(--color-red-600)] font-semibold">
                No advisory section assigned
              </p>
            )}
            <p className="hidden lg:block lg:text-end font-roboto text-xs sm:text-sm md:text-md text-[var(--color-text-600)] break-all underline mt-1">
              {profile?.email || "No email available"}
            </p>
          </div>
        </div>

        {/* [SECTION] Dashboard Overview */}
        <div className="lg:flex-8 bg-[var(--color-bg-100)] rounded-xl px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-5 sm:py-8 md:py-11 lg:py-14 xl:py-17 shadow-md">
          <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
            <DashboardItem
              iconSrc="/class-size.svg"
              text="Class Size"
              value={advisorySection?.classSize ?? 0}
            />
            <DashboardItem
              iconSrc="/present-today.svg"
              text="Present Today"
              value={profile?.presentToday ?? 0}
              color="#0066CC"
            />
            <DashboardItem
              iconSrc="/pending-tasks.svg"
              text="Pending Tasks"
              value={profile?.pendingTasks ?? 0}
            />
          </div>
        </div>
      </div>

      {/* [SECTION] Dashboard Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14">
        <DashboardButton
          iconSrc="/dashboard-students.svg"
          text="View Students"
          color="#0066CC"
          to={advisorySection ? `/adviser/classes/${advisorySection.id}/students` : "#"}
          disabled={!advisorySection}
        />
        <DashboardButton
          iconSrc="/dashboard-grades.svg"
          text="Grades"
          color="#CA8E02"
          to={advisorySection ? `/adviser/classes/${advisorySection.id}/grades` : "#"}
          disabled={!advisorySection}
        />
        <DashboardButton
          iconSrc="/dashboard-reports.svg"
          text="Reports"
          color="#8F28A4"
          disabled={!advisorySection}
        />
        <DashboardButton
          iconSrc="/dashboard-school-forms.svg"
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