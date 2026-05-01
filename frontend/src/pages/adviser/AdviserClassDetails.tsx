/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import ClassCard from "../../components/cards/class/ClassCard";
import InfoItem from "../../components/info/InfoItem";
import DashboardButton from "../../components/buttons/DashboardButton";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Types
import { GeneralModalConfig, Section } from "../../types";

const AdviserClassDetails = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [section, setSection] = useState<Section | null>(null);
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

  // * [HANDLE] Fetch Section Details
  const fetchSection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}`,
        {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch section");

      const sec = data.data;

      // [COMPUTE] Male / female counts from enrollments
      let maleCount = 0;
      let femaleCount = 0;
      (sec.enrollments || []).forEach((enroll: { student?: { sex?: string } | null }) => {
        const sex = enroll.student?.sex;
        if (sex === "MALE") maleCount++;
        else if (sex === "FEMALE") femaleCount++;
      });

      setSection({
        id: sec.id,
        name: sec.name,
        gradeLevel: sec.gradeLevel,
        schoolYear: sec.schoolYear,
        color: sec.color || "#999999",
        classSize: sec.classSize || 0,
        curriculum: sec.curriculum,
        maleCount,
        femaleCount,
      });
    } catch (err: unknown) {
      // ! [ERROR] Fetching section failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Section",
        message: "We couldn't load the section details at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) fetchSection();
  }, [sectionId]);

  // * [BREADCRUMBS] Adviser Class Details navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section?.name ?? "Details", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  return (
    <>
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

      {/* [LAYOUT] Adviser Page */}
      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="Section Details" />}
      >
        {section ? (
          <div className="space-y-4">

            {/* [COMPONENT] Class Card */}
            <ClassCard
              id={section.id}
              name={section.name}
              classSize={section.classSize}
              curriculum={section.curriculum}
              gradeLevel={section.gradeLevel}
              displayFields={false}
            />

            {/* [CARD] Overview */}
            <div className="bg-[var(--color-bg-100)] rounded-xl px-4 sm:px-6 md:px-8 py-5 sm:py-6 shadow-md">
              <h2 className="mb-3 text-base sm:text-lg font-semibold">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <InfoItem
                  iconSrc="/class-size.svg"
                  text="Class Size"
                  value={section.classSize}
                  color="var(--color-primary-700)"
                />

                <InfoItem
                  iconSrc="/male.svg"
                  text="Male Students"
                  value={section.maleCount ?? 0}
                  color="var(--color-primary-600)"
                />

                <InfoItem
                  iconSrc="/female.svg"
                  text="Female Students"
                  value={section.femaleCount ?? 0}
                  color="var(--color-violet-600)"
                />

                <InfoItem
                  iconSrc="/school-year.svg"
                  text="School Year"
                  value={String(section.schoolYear)}
                  color="var(--color-orange-600)"
                />
              </div>
            </div>

            {/* [SECTION] Dashboard Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14">
              <DashboardButton
                iconSrc="/dashboard-students.svg"
                text="View Students"
                color="#0066CC"
                to={`/adviser/classes/${sectionId}/students`}
              />
              <DashboardButton
                iconSrc="/dashboard-grades.svg"
                text="Grades"
                color="#CA8E02"
                to={`/adviser/classes/${sectionId}/grades`}
              />
              <DashboardButton
                iconSrc="/dashboard-reports.svg"
                text="Reports"
                color="#8F28A4"
              />
              <DashboardButton
                iconSrc="/dashboard-school-forms.svg"
                text="School Forms"
                color="#28A428"
                to={`/adviser/school-forms/${sectionId}`}
              />
            </div>

          </div>
        ) : (
          // [EMPTY STATE] Section not found
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Section not found.</p>
            <button
              onClick={() => navigate("/adviser/classes")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Classes
            </button>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default AdviserClassDetails;