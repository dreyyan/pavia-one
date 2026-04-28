/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import InputField from "../../components/toolbar/InputField";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";
import PersonInfoCard from "../../components/cards/PersonInfoCard";
import StudentsListCard from "../../components/cards/details/StudentsListCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import DeleteButton from "../../components/buttons/DeleteButton";
import { AssignAdviserFormModal } from "../../components/forms/AssignAdviserFormModal";

// [IMPORT] Constants & Types
import { GRADE_LEVEL_OPTIONS, CURRICULUM_OPTIONS, LEARNING_MODALITY_OPTIONS } from "../../constants";
import { GeneralModalConfig, SectionDetails } from "../../types";
import SecondaryButton from "../../components/buttons/SecondaryButton";

// ? [TYPE] Active form page index
type FormPage = 0 | 1;

const PAGE_LABELS: [string, string] = ["Section Info", "Configuration"];

const AdminSectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES] Entities
  const [section, setSection] = useState<SectionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Identity Card
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SectionDetails>>({});

  // [STATES] Assign Adviser Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [advisers, setAdvisers] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

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

  // * [HANDLE] Fetch Section by ID
  const fetchSection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch section");

      setSection(data.data);
      setFormData(data.data);
    } catch (err) {
      // ! [ERROR] Fetching section failed
      console.error("Failed to fetch section:", err);
      openGeneralModal({
        title: "Unable to Load Section",
        message: "We couldn't load the section at the moment. Please check your internet connection and try again.",
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
    if (id) fetchSection();
  }, [id]);

  // * [HANDLE] Delete Section
  const handleDelete = (sectionId: number) => {
    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Section",
      message: "Are you sure you want to delete this section? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${sectionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Failed to delete section");

          // * [SUCCESS] Section Deleted
          openGeneralModal({
            title: "Section Deleted",
            message: "The section has been deleted successfully.",
            type: "success",
            isCancelable: false,
            onConfirm: () => {
              closeGeneralModal();
              navigate("/admin/sections");
            },
          });
        } catch (err: any) {
          // ! [ERROR] Section deletion failed
          console.error("Delete error:", err);
          openGeneralModal({
            title: "Unable to Delete Section",
            message: err?.message || "We couldn't delete the section at the moment. Please check your internet connection and try again.",
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // [HANDLE] Edit toggle — discard changes on cancel
  const handleEditToggle = () => {
    if (isEditing) setFormData(section ?? {});
    setIsEditing(prev => !prev);
  };

  // * [HANDLE] Save Updated Section Details
  const handleSave = async () => {
    const rawYear = (formData.schoolYear || "").trim();
    const yearMatch = rawYear.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (!yearMatch) {
      openGeneralModal({
        title: "Invalid School Year",
        message: 'Please enter the school year in "YYYY - YYYY" format (e.g. 2024 - 2025).',
        type: "error",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }
    const normalizedSchoolYear = `${yearMatch[1]} - ${yearMatch[2]}`;

    const payload: Record<string, unknown> = {
      name: (formData.name ?? "").trim() || undefined,
      gradeLevel: formData.gradeLevel ? Number(formData.gradeLevel) : undefined,
      schoolYear: normalizedSchoolYear,
      curriculum: formData.curriculum || undefined,
      learningModality: formData.learningModality || undefined,
      room: formData.room ?? null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update section");

      // [UPDATE] Merge saved changes into section state
      setSection(prev => prev ? { ...prev, ...payload, schoolYear: normalizedSchoolYear } : prev);
      setIsEditing(false);

      // * [SUCCESS] Section Updated
      openGeneralModal({
        title: "Section Updated",
        message: `"${formData.name}" has been updated successfully.`,
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Section update failed
      console.error("Update error:", err);
      openGeneralModal({
        title: "Unable to Update Section",
        message: "We couldn't save your changes. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Generic form field change
  const handleFieldChange =
    (field: keyof SectionDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  // * [FETCH] Advisers — lazy, only when the assign modal is first opened
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setShowTokenExpiredModal(true); return; }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch advisers");
      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      // ! [ERROR] Fetching advisers failed
      console.error("Fetch advisers error:", err);
      openGeneralModal({
        title: "Unable to Load Advisers",
        message: "We couldn't load the adviser list. Please close and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    }
  };

  // [HANDLE] Open assign adviser modal
  const handleAssignAdviser = async () => {
    if (advisers.length === 0) await fetchAdvisers();
    setShowAssignModal(true);
  };

  // [HANDLE] Open unassign adviser modal
  const handleUnassignAdviser = () => {
    if (!id) return;

    openGeneralModal({
      title: "Unassign Adviser",
      message:
        "Are you sure you want to unassign the adviser from this section?",
      type: "error",
      confirmText: "Unassign",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);

        try {
          const token = localStorage.getItem("token");

          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}/unassign-adviser`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await res.json();

          if (!data.success) {
            throw new Error(data.message || "Failed to unassign adviser");
          }

          // ? Update UI state
          setSection(prev =>
            prev
              ? {
                  ...prev,
                  adviserId: null,
                  adviser: undefined,
                }
              : prev
          );

          // * SUCCESS MODAL
          openGeneralModal({
            title: "Adviser Unassigned",
            message: "The adviser has been removed from this section.",
            type: "success",
            isCancelable: false,
            confirmText: "OK",
            onConfirm: () => closeGeneralModal(),
          });
        } catch (err: any) {
          console.error("Unassign error:", err);

          openGeneralModal({
            title: "Unassign Failed",
            message:
              err?.message ||
              "We couldn't unassign the adviser. Please try again.",
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // [HANDLE] Submit adviser assignment
  const handleAssignSubmit = async (adviserId: string, adviserName: string) => {
    setAssignLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adviserId }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to assign adviser");

      // [UPDATE] Optimistically update adviser card without a full re-fetch
      setSection(prev =>
        prev
          ? {
              ...prev,
              adviser: {
                id: data.data?.adviserId ?? prev.adviser?.id ?? 0,
                adviserId,
                name: adviserName,
              },
            }
          : prev
      );

      setShowAssignModal(false);

      // * [SUCCESS] Adviser Assigned
      openGeneralModal({
        title: "Adviser Assigned",
        message: `"${adviserName}" has been assigned to ${section?.name} successfully.`,
        type: "success",
        confirmText: "Done",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Adviser assignment failed
      console.error("Assign adviser error:", err);
      openGeneralModal({
        title: "Assignment Failed",
        message: err?.message || "We couldn't assign the adviser. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setAssignLoading(false);
    }
  };

  // * [BREADCRUMBS] Admin Section Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Sections", path: "/admin/sections" },
    {
      label: section
        ? `${section.name} (Grade ${section.gradeLevel})`
        : "Details",
      path: null,
    },
  ];

  // * [RENDER] Form fields per active page
  const renderFormPage = () => {
    if (!section) return null;

    // [PAGE 0] Section Info
    if (activePage === 0) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="Section Name"
              value={formData.name ?? ""}
              onChange={handleFieldChange("name")}
              placeholder="e.g. Rizal, Mabini"
              disabled={!isEditing}
              required
            />
          </div>
          <InputField
            label="Grade Level"
            type="select"
            value={formData.gradeLevel ? String(formData.gradeLevel) : ""}
            onChange={handleFieldChange("gradeLevel")}
            placeholder="Select grade level"
            options={GRADE_LEVEL_OPTIONS.map(g => String(g))}
            disabled={!isEditing}
            required
          />
          <InputField
            label="School Year"
            value={formData.schoolYear ?? ""}
            onChange={handleFieldChange("schoolYear")}
            placeholder="e.g. 2024 - 2025"
            disabled={!isEditing}
            required
          />
          <InputField
            label="Room"
            value={formData.room ?? ""}
            onChange={handleFieldChange("room")}
            placeholder="e.g. Room 101"
            disabled={!isEditing}
          />
        </div>
      );
    }

    // [PAGE 1] Configuration
    if (activePage === 1) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Curriculum"
            type="select"
            value={formData.curriculum ?? ""}
            onChange={handleFieldChange("curriculum")}
            placeholder="Select curriculum"
            options={CURRICULUM_OPTIONS.map(o => o.value)}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Learning Modality"
            type="select"
            value={formData.learningModality ?? ""}
            onChange={handleFieldChange("learningModality")}
            placeholder="Select modality"
            options={LEARNING_MODALITY_OPTIONS.map(o => o.value)}
            disabled={!isEditing}
          />
        </div>
      );
    }

    return null;
  };

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

      {/* [MODAL] Assign Adviser */}
      <AssignAdviserFormModal
        isOpen={showAssignModal}
        sectionName={section?.name ?? ""}
        currentAdviser={section?.adviser ?? null}
        advisers={advisers}
        loading={assignLoading}
        onClose={() => setShowAssignModal(false)}
        onSubmit={handleAssignSubmit}
      />

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Section Details" />
        }
      >
        {section ? (
          <div className="space-y-4">

            {/* [HEADER] Section name + grade badge */}
            <div className="bg-[var(--color-bg-100)] rounded-lg px-4 py-4 flex items-center gap-4">
              <div className="size-14 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-2xl border border-[var(--color-primary-200)] flex-shrink-0">
                {section.gradeLevel}
              </div>
              <div>
                <p className="text-xl font-bold font-roboto text-[var(--color-text-900)]">
                  {section.name}
                </p>
                <p className="text-sm font-roboto text-[var(--color-text-600)]">
                  Grade {section.gradeLevel} · {section.curriculum} · {section.schoolYear}
                </p>
              </div>
            </div>

            {/* [ACTIONS] Assign Adviser + Delete */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full xl:w-auto xl:ml-auto">
              <PrimaryButton
                text="Assign Adviser"
                iconSrc="/assign-adviser.svg"
                onClick={handleAssignAdviser}
              />
              <SecondaryButton
                text="Unassign Adviser"
                iconSrc="/unassign.svg"
                onClick={handleUnassignAdviser}
              />
              <DeleteButton
                onClick={() => handleDelete(section.id)}
                text="Delete Section"
                disabled={loading}
              />
            </div>

            {/* [CARD] Section Identity */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [UI] Page tabs */}
              <div className="flex gap-1 bg-[var(--color-bg-200)] rounded-lg p-1">
                {PAGE_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePage(idx as FormPage)}
                    className={`flex-1 text-xs font-roboto font-medium py-1.5 px-2 rounded-md transition-all duration-150 cursor-pointer ${
                      activePage === idx
                        ? "bg-[var(--color-bg-50)] text-[var(--color-text-900)] shadow-sm"
                        : "text-[var(--color-text-600)] hover:text-[var(--color-text-800)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [HEADER] Section title + Edit / Save buttons */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                  {PAGE_LABELS[activePage]}
                </p>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="text-xs font-roboto font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  )}
                  <button
                    onClick={handleEditToggle}
                    disabled={loading}
                    className={`text-xs font-roboto font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEditing
                        ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                        : "text-[var(--color-text-50)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)]"
                    }`}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>

              {/* [FORM] Dynamic fields based on active page */}
              {renderFormPage()}

            </div>

            {/* [COMPONENT] Adviser */}
            <PersonInfoCard title="Adviser" person={section.adviser ?? null} />

            {/* [COMPONENT] Students List */}
            <StudentsListCard
              students={section.students ?? []}
              classSize={section.classSize}
            />

            {/* [META] Creation date */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Created{" "}
              {new Date(section.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

          </div>
        ) : (
          // [EMPTY STATE] Section not found
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Section not found.</p>
            <button
              onClick={() => navigate("/admin/sections")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Sections
            </button>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default AdminSectionDetails;