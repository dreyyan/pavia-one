/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import Dropdown from "../../components/Dropdown";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import Breadcrumbs from "../../components/Breadcrumbs";
import SubjectCard from "../../components/cards/subject/SubjectCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import SubjectFormModal from "../../components/forms/SubjectFormModal";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Helpers, Constants & Types
import { getVisiblePages } from "../../helpers/index";
import { GRADE_LEVEL_OPTIONS, CURRICULUM_OPTIONS } from "../../constants";
import { LearningAreaFormData, GeneralModalConfig } from "../../types";

// ? [INTERFACE] Subject entity
interface Subject {
  id: number;
  code: string;
  name: string;
  gradeLevel: number;
  hoursPerWeek?: number;
  description?: string;
  curriculum?: string;
  writtenWorkWeight?: number;
  performanceTaskWeight?: number;
  quarterlyAssessmentWeight?: number;
  createdAt: string;
}

// [CONSTANT] Empty form state
const EMPTY_FORM: LearningAreaFormData = {
  name: "",
  gradeLevel: "",
  curriculum: "Regular",
  writtenWorkWeight: "0.3",
  performanceTaskWeight: "0.5",
  quarterlyAssessmentWeight: "0.2",
};

const AdminSubjects = () => {
  const navigate = useNavigate();

  // [STATES] Entities
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "filter" | null>(null);

  type SortOption = "name-asc" | "name-desc" | "grade-asc" | "grade-desc";
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);

  // [STATES] Subject Form Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<LearningAreaFormData>(EMPTY_FORM);

  // [STATES] Auto-Create Modal
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [autoCreating, setAutoCreating] = useState(false);
  const [autoCreateError, setAutoCreateError] = useState("");

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // [EFFECT] Update items per page based on screen width (responsive design)
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;

      if (width < 768) setItemsPerPage(5);        // xs (cards)
      else if (width < 1024) setItemsPerPage(6);  // md (cards)
      else if (width < 1280) setItemsPerPage(8);  // lg (table)
      else if (width < 1536) setItemsPerPage(10); // xl (table)
      else setItemsPerPage(12);                   // 2xl (table)
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

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
    setGeneralModal({
      ...generalModal,
      isOpen: true,
      ...config,
    });
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // * [HANDLE] Fetch Subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch subjects");

      setSubjects(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      // ! [ERROR] Fetching subjects failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Subjects",
        message: "We couldn't load your subjects at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // * [HANDLE] Open Create Modal
  const handleAddSubject = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowSubjectModal(true);
  };

  // * [HANDLE] Submit Create Form
  const handleSubmit = async () => {
    setLoading(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          gradeLevel: Number(formData.gradeLevel),
          curriculum: formData.curriculum,
          writtenWorkWeight: Number(formData.writtenWorkWeight),
          performanceTaskWeight: Number(formData.performanceTaskWeight),
          quarterlyAssessmentWeight: Number(formData.quarterlyAssessmentWeight),
        }),
      });

      const data = await res.json();

      // ! [ERROR] Failed API response
      if (!data.success) throw new Error(data.message || "Failed to add subject");

      setShowSubjectModal(false);
      await fetchSubjects();

      // * [SUCCESS] Subject Created
      openGeneralModal({
        title: "Subject Created",
        message: "The subject has been added successfully.",
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Subject creation failed
      console.error(err);
      const errorMessage = err.message || "An unexpected error occurred while creating the subject.";
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Auto-Create All Subjects
  const handleAutoCreate = async () => {
    setAutoCreating(true);
    setAutoCreateError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/auto-create-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Auto-create failed");

      const summary: { gradeLevel: number; curriculum: string; createdCount: number }[] = data.data;
      const totalCreated = summary.reduce((sum, s) => sum + s.createdCount, 0);
      setShowAutoCreateModal(false);
      await fetchSubjects();

      // * [SUCCESS] Subjects Auto-Created
      openGeneralModal({
        title: "Subjects Created",
        message: `${totalCreated} subject(s) created across ${CURRICULUM_OPTIONS.length} curricula × 4 grade levels. Existing subjects were skipped.`,
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Auto-Create Failed
      console.error(err);
      setAutoCreateError(err.message || "Something went wrong. Please try again.");
      openGeneralModal({
        title: "Unable to Create Subjects",
        message: "Something went wrong while creating subjects. Please check your internet connection and try again.",
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setAutoCreating(false);
    }
  };

  // * [HANDLE] Sorting, Searching & Filtering
  const filteredSubjects = subjects
    .filter(s =>
      (
        (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
        (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
      ) &&
      (selectedGrades.length === 0 || selectedGrades.includes(String(s.gradeLevel))) &&
      (selectedCurricula.length === 0 || (s.curriculum != null && selectedCurricula.includes(s.curriculum)))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":   return a.name.localeCompare(b.name);
        case "name-desc":  return b.name.localeCompare(a.name);
        case "grade-asc":  return a.gradeLevel - b.gradeLevel;
        case "grade-desc": return b.gradeLevel - a.gradeLevel;
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const displayedSubjects = filteredSubjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // * [BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Subjects", path: null },
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

      {/* [MODAL] Auto-Create Subjects */}
      <Modal
        isOpen={showAutoCreateModal}
        onClose={() => { setShowAutoCreateModal(false); setAutoCreateError(""); }}
        title="Auto-Create All Subjects"
        type="default"
        confirmText={autoCreating ? "Creating..." : "Create"}
        onConfirm={handleAutoCreate}
        isCancelable={!autoCreating}
      >
        <div className="p-1 space-y-4">
          <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-lg p-3 space-y-2">
            <p className="text-sm text-[var(--color-text-700)]">
              This will create <strong>all standard subjects per grade level × curriculum</strong> combination
              — up to <strong>50 subjects</strong> in total depending on the curriculum.
              Subjects that already exist will be skipped.
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs text-[var(--color-text-500)]">
              <div>
                <p className="font-semibold text-[var(--color-text-700)] mb-0.5">Grade Levels</p>
                {["7", "8", "9", "10"].map(g => <p key={g}>Grade {g}</p>)}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-700)] mb-0.5">Curricula</p>
                {CURRICULUM_OPTIONS.map(c => <p key={c.value}>{c.label}</p>)}
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-400)] italic">
              Each curriculum includes core subjects. STE, SPJ, SPS, and SPA also include their specialized subjects.
            </p>
          </div>
          {autoCreateError && (
            <p className="text-xs text-red-600 font-medium">{autoCreateError}</p>
          )}
        </div>
      </Modal>

      {/* [MODAL] Subject Form */}
      <SubjectFormModal
        isOpen={showSubjectModal}
        title="Create Subject"
        onClose={() => setShowSubjectModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
      />

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Subjects" />
        }
        toolbar={
          <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 md:gap-4 w-full">
                {/* [COMPONENT] Search Bar */}
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={search}
                    placeholder="Search by name or code..."
                    onChange={setSearch}
                    onResetPage={() => setPage(1)}
                  />
                </div>

                {/* [COMPONENT] Sort & Filter Dropdowns */}
                <div className="flex gap-x-2 ml-auto shrink-0">
                  <Dropdown
                    icon="/sort.svg"
                    label="Sort"
                    isOpen={activeDropdown === "sort"}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === "sort" ? null : "sort")
                    }
                    selected={sortOption}
                    onSelect={(value) => {
                      setSortOption(value as SortOption);
                      setPage(1);
                    }}
                    options={[
                      { label: "Name (A → Z)", value: "name-asc" },
                      { label: "Name (Z → A)", value: "name-desc" },
                      { label: "Grade ↑", value: "grade-asc" },
                      { label: "Grade ↓", value: "grade-desc" },
                    ]}
                  />

                  {/* [COMPONENT] Filter Dropdown */}
                  <Dropdown
                    icon="/filter.svg"
                    label="Filter"
                    isOpen={activeDropdown === "filter"}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === "filter" ? null : "filter")
                    }
                    width="w-52"
                    groups={[
                      {
                        label: "Grade",
                        options: GRADE_LEVEL_OPTIONS.map(g => ({ label: `Grade ${g}`, value: String(g) })),
                        selectedValues: selectedGrades,
                        onSelectMultiple: (v) => { setSelectedGrades(v); setPage(1); },
                      },
                      {
                        label: "Curriculum",
                        options: CURRICULUM_OPTIONS.map(c => ({ label: c.label, value: c.value })),
                        selectedValues: selectedCurricula,
                        onSelectMultiple: (v) => { setSelectedCurricula(v); setPage(1); },
                      },
                    ]}
                  />
                </div>
              </div>

              {/* [ACTION BUTTONS] Add Subject + Auto-Create */}
              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto xl:ml-auto">
                <PrimaryButton
                  text="Add Subject"
                  iconSrc="/add.svg"
                  onClick={handleAddSubject}
                />
                <SecondaryButton
                  text="Auto-Create Subjects"
                  iconSrc="/auto-generate.svg"
                  onClick={() => { setAutoCreateError(""); setShowAutoCreateModal(true); }}
                />
              </div>
            </div>
          </div>
        }
        footer={
          // [COMPONENT] Pagination
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            getVisiblePages={getVisiblePages}
          />
        }>
        <div className="space-y-3">

          {/* [SECTION] Subject Cards (Mobile View) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {!loading && displayedSubjects.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No subjects found"
                  subtitle="No subjects match your current filters or search."
                />
              </div>
            )}

            {displayedSubjects.map((s) => (
              <SubjectCard key={s.id} subject={s} />
            ))}
          </div>

          {/* [SECTION] Subjects Table (Desktop View) */}
          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {!loading && displayedSubjects.length === 0 && (
              <EmptyState
                title="No subjects found"
                subtitle="No subjects match your current filters or search."
              />
            )}

            {displayedSubjects.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    {/* [SECTION] Table Headers */}
                    <th className="table-header">Subject</th>
                    <th className="table-header">Code</th>
                    <th className="table-header">Grade</th>
                    <th className="table-header">Curriculum</th>
                    <th className="table-header">Hrs/Week</th>
                  </tr>
                </thead>

                {/* [SECTION] Table Body */}
                <tbody>
                  {displayedSubjects.map((s) => (
                    <tr
                      key={s.id}
                      className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
                      onClick={() => navigate(`/admin/subjects/view/${s.id}`)}
                    >
                      <td className="table-cell table-text table-text-link hover:underline">
                        {s.name}
                      </td>

                      <td className="table-cell table-text table-text-default font-mono text-xs">
                        {s.code}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        Grade {s.gradeLevel}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {s.curriculum ?? "—"}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {s.hoursPerWeek ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </PageLayout>
    </>
  );
};

export default AdminSubjects;