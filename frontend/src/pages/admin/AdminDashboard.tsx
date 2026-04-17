// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import DashboardButton from "../../components/buttons/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";
import DashboardIconButton from "../../components/buttons/DashboardIconButton";

// [IMPORT] Types
import { GeneralModalConfig, Profile, DashboardSummary } from "../../types";

const AdminDashboard = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  // [STATES] Dashboard Summary
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAdvisers, setTotalAdvisers] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
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

  // * [EFFECT] Fetch dashboard summary
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

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
        navigate("/login/admin");
      }
    });
  };

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

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

            {/* [BUTTON] Admin Profile */}
            <DashboardIconButton
              iconSrc="/profile-icon-white.svg"
              alt="Admin Profile"
              label="Profile"
              onClick={() => navigate("/admin/profile")}
              variant="primary"
            />

            {/* [BUTTON] Admin Settings */}
            <DashboardIconButton
              iconSrc="/settings-icon-white.svg"
              alt="Admin Settings"
              label="Settings"
              onClick={() => navigate("/admin/settings")}
              variant="neutral"
            />

            {/* [BUTTON] Admin Logout */}
            <DashboardIconButton
              iconSrc="/logout-icon-white.svg"
              alt="Admin Logout"
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
            <p className="lg:text-end font-roboto sm:font-semibold lg:font-medium text-sm sm:text-md md:text-lg lg:text-md xl:text-3xl text-[var(--color-text-700)]">
              Administrator
            </p>
            <p className="hidden lg:block lg:text-end font-roboto text-xs sm:text-sm md:text-base text-[var(--color-text-600)] break-all underline">
              {profile?.email || "No email available"}
            </p>
          </div>
        </div>

        {/* [SECTION] Dashboard Overview */}
        <div className="lg:flex-8 bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-4 sm:px-5 md:px-6 py-5 sm:py-6 shadow-md">
          
          <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">
            Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
            <DashboardItem
              iconSrc="/total-students-icon.svg"
              text="Total Students"
              value={totalStudents}
            />
            <DashboardItem
              iconSrc="/total-advisers-icon.svg"
              text="Total Advisers"
              value={totalAdvisers}
              color="#0066CC"
            />
            <DashboardItem
              iconSrc="/total-sections-icon.svg"
              text="Total Sections"
              value={totalSections}
            />
            <DashboardItem
              iconSrc="/total-admin-icon.svg"
              text="Total Admins"
              value={totalAdmins}
              color="#0066CC"
            />
          </div>
        </div>
      </div>

      {/* [SECTION] Dashboard Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14">
        <DashboardButton
          iconSrc="/students-dashboard-icon.svg"
          text="Students"
          color="#0066CC"
          to={"/admin/students"}
        />
        <DashboardButton
          iconSrc="/advisers-dashboard-icon.svg"
          text="Advisers"
          color="#CA8E02"
          to={"/admin/advisers"}
        />
        <DashboardButton
          iconSrc="/sections-dashboard-icon.svg"
          text="Sections"
          color="#8F28A4"
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