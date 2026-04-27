/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import InputField from "../../components/toolbar/InputField";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";
import { WeightRow } from "../../components/WeightRow";
import DeleteButton from "../../components/buttons/DeleteButton";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";

// [IMPORT] Constants & Types
import { GRADE_LEVEL_OPTIONS, CURRICULUM_OPTIONS, SUBJECT_PAGE_LABELS } from "../../constants";
import type { GeneralModalConfig, LearningAreaDetails, Adviser } from "../../types";

// ? [TYPE] Active form page index
type FormPage = 0 | 1;

const AdminSubjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // [STATES] Entities
  const [subject, setSubject] = useState<LearningAreaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Identity Card
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LearningAreaDetails>>({});

  // [STATES] Assign Adviser Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [adviserSearch, setAdviserSearch] = useState("");
  const [selectedAdviserId, setSelectedAdviserId] = useState<number | null>(null);
  const [selectedAdviserName, setSelectedAdviserName] = useState("");
  const [showAdviserDropdown, setShowAdviserDropdown] = useState(false);
  const [assignFormError, setAssignFormError] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const adviserDropdownRef = useRef<HTMLDivElement>(null);
  const adviserInputRef = useRef<HTMLInputElement>(null);

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

  // * [EFFECT] Close adviser dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (adviserDropdownRef.current && !adviserDropdownRef.current.contains(e.target as Node)) {
        setShowAdviserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // * [HANDLE] Fetch Subject by ID
  const fetchSubject = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch subject");

      setSubject(data.data);
      setFormData(data.data);
    } catch (err) {
      // ! [ERROR] Fetching subject failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Subject",
        message: "We couldn't load your subject at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // * [FETCH] Advisers — lazy, only when the assign modal is first opened
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch advisers");
      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      // ! [ERROR] Fetching advisers failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Advisers",
        message: "We couldn't load the adviser list. Please try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  // * [HANDLE] Open Assign Adviser Modal
  const handleAssignAdviser = async () => {
    if (advisers.length === 0) await fetchAdvisers();
    setAdviserSearch("");
    setSelectedAdviserId(null);
    setSelectedAdviserName("");
    setAssignFormError("");
    setShowAdviserDropdown(false);
    setShowAssignModal(true);
    setTimeout(() => adviserInputRef.current?.focus(), 50);
  };

  // * [HANDLE] Submit Adviser Assignment
  const handleAssignSubmit = async () => {
    if (!selectedAdviserId) {
      setAssignFormError("Please select an adviser from the list.");
      return;
    }

    setAssignLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}/assign-adviser`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ adviserId: selectedAdviserId }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        openGeneralModal({
          title: "Unable to Assign Adviser",
          message: data.message || "Failed to assign adviser. Please try again.",
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });

        throw new Error(data.message || "Failed to assign adviser");
      }

      setSubject(data.data);
      setShowAssignModal(false);

      // * [SUCCESS] Adviser Assigned
      openGeneralModal({
        title: "Adviser Assigned",
        message: `"${selectedAdviserName}" has been assigned to ${subject?.name} successfully.`,
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Adviser assignment failed
      console.error(err);
      setAssignFormError(err.message || "Failed to assign adviser. Please try again.");
    } finally {
      setAssignLoading(false);
    }
  };

  // * [HANDLE] Unassign Adviser
  const handleUnassignAdviser = () => {
    // ? [CONFIRMATION] Before unassigning, ask user to confirm
    openGeneralModal({
      title: "Unassign Adviser",
      message: "Are you sure you want to remove the assigned adviser from this subject?",
      type: "error",
      confirmText: "Unassign",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}/unassign-adviser`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          if (!data.success) {
            openGeneralModal({
              title: "Unable to Assign Adviser",
              message: data.message || "Failed to unassign adviser. Please try again.",
              type: "error",
              confirmText: "Close",
              isCancelable: false,
              onConfirm: () => closeGeneralModal(),
            });

            throw new Error(data.message || "Failed to unassign adviser");
          }

          setSubject(data.data);

          // * [SUCCESS] Adviser Unassigned
          openGeneralModal({
            title: "Adviser Removed",
            message: "The adviser has been unassigned from this subject successfully.",
            type: "success",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } catch (err: any) {
          // ! [ERROR] Unassign adviser failed
          console.error(err);
          openGeneralModal({
            title: "Unable to Unassign Adviser",
            message: err.message || "We couldn't unassign the adviser. Please try again.",
            type: "error",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // * [HANDLE] Delete Subject
  const handleDelete = () => {
    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Subject",
      message: "Are you sure you want to delete this subject? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Failed to delete subject");

          // * [SUCCESS] Subject Deleted
          openGeneralModal({
            title: "Subject Deleted",
            message: "The subject has been deleted successfully.",
            type: "success",
            isCancelable: false,
            onConfirm: () => {
              closeGeneralModal();
              navigate("/admin/subjects");
            },
          });
        } catch (err) {
          // ! [ERROR] Subject deletion failed
          console.error("Delete error:", err);
          openGeneralModal({
            title: "Unable to Delete Subject",
            message: "We couldn't delete the subject at the moment. Please check your internet connection and try again.",
            type: "error",
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
    if (isEditing) setFormData(subject ?? {});
    setIsEditing(prev => !prev);
  };

  // * [HANDLE] Save Updated Subject Details
  const handleSave = async () => {
    const weightSum =
      Number(formData.writtenWorkWeight ?? 0) +
      Number(formData.performanceTaskWeight ?? 0) +
      Number(formData.quarterlyAssessmentWeight ?? 0);

    // ! [VALIDATION] Weights must sum to 100%
    if (Math.abs(weightSum - 1.0) >= 0.001) {
      openGeneralModal({
        title: "Invalid Weights",
        message: "Grading weights must sum to 100%. Please adjust the weights.",
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          writtenWorkWeight: Number(formData.writtenWorkWeight),
          performanceTaskWeight: Number(formData.performanceTaskWeight),
          quarterlyAssessmentWeight: Number(formData.quarterlyAssessmentWeight),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update subject");

      // [UPDATE] Merge saved changes into subject state
      setSubject({ ...subject!, ...formData } as LearningAreaDetails);
      setIsEditing(false);

      // * [SUCCESS] Subject Updated
      openGeneralModal({
        title: "Subject Updated",
        message: "The subject has been updated successfully.",
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Subject update failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Update Subject",
        message: "We couldn't update your subject at the moment. Please check your internet connection and try again.",
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Generic text / select field change
  const handleFieldChange =
    (field: keyof LearningAreaDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  // [HANDLE] Numeric weight field change
  const handleWeightChange =
    (field: keyof LearningAreaDetails) =>
    (v: string) => {
      setFormData(prev => ({ ...prev, [field]: v === "" ? 0 : Number(v) }));
    };

  // [COMPUTE] Filtered advisers for the searchable dropdown
  const filteredAdvisers = advisers.filter(
    a =>
      a.name.toLowerCase().includes(adviserSearch.toLowerCase()) ||
      a.adviserId.toLowerCase().includes(adviserSearch.toLowerCase()) ||
      (a.email ?? "").toLowerCase().includes(adviserSearch.toLowerCase())
  );

  // * [BREADCRUMBS] Admin Subject Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Subjects", path: "/admin/subjects" },
    { label: subject ? `${subject.name} (Grade ${subject.gradeLevel})` : "Details", path: null },
  ];

  // [COMPUTE] Live weight sum for validation and display
  const weightSum =
    Number(formData.writtenWorkWeight ?? 0) +
    Number(formData.performanceTaskWeight ?? 0) +
    Number(formData.quarterlyAssessmentWeight ?? 0);
  const weightsAreValid = Math.abs(weightSum - 1.0) < 0.001;

  // * [RENDER] Form fields per active page
  const renderFormPage = () => {
    if (!subject) return null;

    // [PAGE 0] Subject Identity
    if (activePage === 0) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="Subject Name"
              value={formData.name ?? ""}
              onChange={handleFieldChange("name")}
              placeholder="e.g. Mathematics, Filipino, Science"
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
            options={GRADE_LEVEL_OPTIONS.map(g => `Grade ${g}`)}
            disabled
          />
          <InputField
            label="Curriculum"
            type="select"
            value={formData.curriculum ?? ""}
            onChange={handleFieldChange("curriculum")}
            placeholder="Select curriculum"
            options={CURRICULUM_OPTIONS.map(opt => opt.label)}
            disabled
          />
          <p className="col-span-2 sm:col-span-3 text-xs font-roboto text-[var(--color-text-500)]">
            Grade level and curriculum cannot be changed — they are part of the subject's unique identity.
          </p>
        </div>
      );
    }

    // [PAGE 1] Grading Weights — WW + PT + QA must always sum to 1.0 (100%)
    if (activePage === 1) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <WeightRow
              label="Written Work"
              hint="e.g. quizzes, seatwork, homework"
              value={formData.writtenWorkWeight ?? 0}
              onChange={handleWeightChange("writtenWorkWeight")}
              disabled={!isEditing}
            />
            <WeightRow
              label="Performance Task"
              hint="e.g. projects, experiments, recitation"
              value={formData.performanceTaskWeight ?? 0}
              onChange={handleWeightChange("performanceTaskWeight")}
              disabled={!isEditing}
            />
            <WeightRow
              label="Quarterly Assessment"
              hint="quarterly exam / summative test"
              value={formData.quarterlyAssessmentWeight ?? 0}
              onChange={handleWeightChange("quarterlyAssessmentWeight")}
              disabled={!isEditing}
            />
          </div>

          {/* [UI] Live weight sum indicator */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-roboto font-medium ${
              weightsAreValid
                ? "bg-green-50 text-[var(--color-accent-700)] border border-[var(--color-accent-200)]"
                : "bg-amber-50 text-[var(--color-red-700)] border border-[var(--color-red-200)]"
            }`}
          >
            <span>Total</span>
            <span>
              {Math.round(weightSum * 100)}%{" "}
              {weightsAreValid ? "✓" : `— needs ${Math.round((1 - weightSum) * 100)}% more`}
            </span>
          </div>
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
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-[var(--color-bg-100)] rounded-lg p-6 w-full max-w-md shadow-lg">

            {/* [HEADER] Title + close */}
            <div className="flex items-start justify-between mb-1 gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-900)]">Assign Adviser</h2>
                <p className="text-xs font-roboto text-[var(--color-text-500)] mt-0.5">
                  Subject: <span className="font-semibold text-[var(--color-text-700)]">{subject?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
                className="text-[var(--color-text-400)] hover:text-[var(--color-text-700)] transition-colors mt-0.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* [UI] Progress bar */}
            <div className="flex gap-1.5 mb-5 mt-3">
              <div className="h-1 flex-1 rounded-full bg-[var(--color-primary-600)]" />
            </div>

            {/* [FIELD] Adviser searchable dropdown */}
            <div className="flex flex-col gap-1 mb-2">
              <label className="font-roboto text-sm">
                Adviser <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <div ref={adviserDropdownRef} className="relative">
                <input
                  ref={adviserInputRef}
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={adviserSearch}
                  onChange={(e) => {
                    setAdviserSearch(e.target.value);
                    if (selectedAdviserId) {
                      setSelectedAdviserId(null);
                      setSelectedAdviserName("");
                    }
                    setShowAdviserDropdown(true);
                    setAssignFormError("");
                  }}
                  onFocus={() => setShowAdviserDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowAdviserDropdown(false);
                    if (e.key === "Enter" && !showAdviserDropdown) handleAssignSubmit();
                  }}
                  className="input-base w-full"
                  autoComplete="off"
                />

                {/* [DROPDOWN] Adviser list */}
                {showAdviserDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-bg-300)] rounded-md shadow-lg max-h-52 overflow-y-auto">
                    {filteredAdvisers.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-[var(--color-text-400)] text-center">
                        No advisers found
                      </p>
                    ) : (
                      filteredAdvisers.map(adviser => {
                        const isSelected = adviser.id === selectedAdviserId;
                        const initials = adviser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <button
                            key={adviser.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setSelectedAdviserId(adviser.id);
                              setSelectedAdviserName(adviser.name);
                              setAdviserSearch(adviser.name);
                              setShowAdviserDropdown(false);
                              setAssignFormError("");
                            }}
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors hover:bg-[var(--color-bg-100)] ${
                              isSelected ? "bg-[var(--color-primary-50)] border-l-2 border-[var(--color-primary-500)]" : ""
                            }`}
                          >
                            <div className={`size-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isSelected
                                ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                                : "bg-[var(--color-bg-200)] text-[var(--color-text-600)]"
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-roboto font-medium truncate ${
                                isSelected ? "text-[var(--color-primary-700)]" : "text-[var(--color-text-900)]"
                              }`}>
                                {adviser.name}
                              </p>
                              <p className="text-xs font-mono text-[var(--color-text-400)]">
                                #{adviser.adviserId}
                                {adviser.email && (
                                  <span className="ml-2 font-sans not-italic">· {adviser.email}</span>
                                )}
                              </p>
                            </div>
                            {isSelected && (
                              <svg className="size-4 text-[var(--color-primary-600)] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* [CARD] Selected adviser confirmation */}
            {selectedAdviserId && (
              <div className="mt-3 bg-[var(--color-bg-50)] border border-[var(--color-primary-200)] rounded-md px-3 py-2.5 flex items-center gap-2.5">
                <div className="size-7 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xs flex-shrink-0">
                  {selectedAdviserName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-roboto text-[var(--color-text-500)]">Will be assigned</p>
                  <p className="text-sm font-roboto font-semibold text-[var(--color-primary-700)] truncate">
                    {selectedAdviserName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdviserId(null);
                    setSelectedAdviserName("");
                    setAdviserSearch("");
                    adviserInputRef.current?.focus();
                  }}
                  className="text-[var(--color-text-400)] hover:text-[var(--color-red-500)] transition-colors cursor-pointer"
                >
                  <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* [ERROR] Form error message */}
            {assignFormError && (
              <p className="text-[var(--color-red-500)] text-sm mt-3">{assignFormError}</p>
            )}

            {/* [FOOTER] Cancel / Assign */}
            <div className="flex justify-between items-center gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
                className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-bg-200)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-300)] transition-colors text-sm disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={assignLoading || !selectedAdviserId}
                className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {assignLoading ? "Assigning..." : "Assign Adviser"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="Subject Details" />}
      >
        {subject ? (
          <div className="space-y-4">

            {/* [HEADER] Subject name + grade badge + curriculum pill */}
            <div className="bg-[var(--color-bg-100)] rounded-lg px-4 py-4 flex items-center gap-4">
              <div className="size-14 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-lg border border-[var(--color-primary-200)] flex-shrink-0 text-center leading-tight">
                G{subject.gradeLevel}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold font-roboto text-[var(--color-text-900)] truncate">
                  {subject.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-roboto text-[var(--color-text-600)]">
                    Grade {subject.gradeLevel}
                  </span>
                  <span className="text-[var(--color-text-400)]">·</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                    {subject.curriculum}
                  </span>
                </div>
              </div>
            </div>

            {/* [ACTIONS] Assign / Unassign Adviser + Delete */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
              <DeleteButton onClick={handleDelete} text="Delete Subject" disabled={loading} />
            </div>

            {/* [CARD] Subject Identity */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [UI] Page tabs */}
              <div className="flex gap-1 bg-[var(--color-bg-200)] rounded-lg p-1">
                {SUBJECT_PAGE_LABELS.map((label, idx) => (
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
                  {SUBJECT_PAGE_LABELS[activePage]}
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

          </div>
        ) : (
          // [EMPTY STATE] Subject not found
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Subject not found.</p>
            <button
              onClick={() => navigate("/admin/subjects")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Subjects
            </button>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default AdminSubjectDetails;