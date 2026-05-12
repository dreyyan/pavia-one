/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Dropdown from "../../components/toolbar/Dropdown";
import SearchBar from "../../components/toolbar/SearchBar";
import Pagination from "../../components/toolbar/Pagination";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import SectionCard from "../../components/cards/section/SectionCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import SectionFormModal from "../../components/forms/SectionFormModal";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Helpers, Constants & Types
import { getVisiblePages, normalizeSchoolYear, getGradeColor } from "../../helpers/index";
import { GRADE_LEVEL_OPTIONS, CURRICULUM_OPTIONS, CURRICULUM_BADGE_MAP } from "../../constants";
import { GeneralModalConfig, Section, SectionFormData } from "../../types";
import Badge from "../../components/badges/Badge";

// [CONSTANT] Empty form state
const EMPTY_FORM: SectionFormData = {
  name: "",
  gradeLevel: "",
  schoolYear: "",
  curriculum: "",
  learningModality: "Face to Face",
  room: "",
  color: "",
  adviserId: "",
  adviserName: "",
};

const AdminSections = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES] Entities
  const [sections, setSections] = useState<Section[]>([]);
  const [advisers, setAdvisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [adviserSearch, setAdviserSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "grade" | null>(null);

  type SortOption = "name-asc" | "name-desc" | "grade-asc" | "grade-desc";
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [selectedGrade, setSelectedGrade] = useState<string | "All">("All");

  // [STATES] Section Form Modal
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<SectionFormData>(EMPTY_FORM);

  // [STATES] Auto-Generate Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateYear, setGenerateYear] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

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

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // [EFFECT] Update items per page based on screen width (responsive design)
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;

      if (width < 768) setItemsPerPage(5);        // xs (cards)
      else if (width < 1024) setItemsPerPage(8);  // md (cards)
      else if (width < 1280) setItemsPerPage(10);  // lg (table)
      else if (width < 1536) setItemsPerPage(12); // xl (table)
      else setItemsPerPage(12);                   // 2xl (table)
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // // [EFFECT] Reload page when screen size changes
  // useEffect(() => {
  //   fetchSections();
  // }, [page, itemsPerPage, search]);

  // * [HANDLE] Fetch Sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setShowTokenExpiredModal(true); return; }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch sections");

      const list = data.data?.data;
      setSections(Array.isArray(list) ? list : []);
    } catch (err) {
      // ! [ERROR] Fetching sections failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Sections",
        message: "We couldn't load your sections at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Fetch Advisers for Dropdown
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      // ! [ERROR] Fetching advisers failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Advisers",
        message: "We couldn't load the advisers at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setAdvisers([]);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchAdvisers();
  }, []);

  // * [HANDLE] Open Create Modal
  const handleAddSection = () => {
    setFormData(EMPTY_FORM);
    setAdviserSearch("");
    setIsEditMode(false);
    setFormError("");
    setShowSectionModal(true);
  };

  // * [HANDLE] Submit Form (Create or Update)
  const handleSubmit = async () => {
    const rawYear = (formData.schoolYear || "").trim();
    const yearMatch = rawYear.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (!yearMatch) {
      setFormError('School year must be in "YYYY - YYYY" format (e.g. 2024 - 2025)');
      return;
    }
    const normalizedSchoolYear = `${yearMatch[1]} - ${yearMatch[2]}`;

    const dataToSubmit = {
      ...(isEditMode && { id: formData.id }),
      name: formData.name.trim(),
      // [NOTE] Adviser is optional — only include if set
      ...(formData.adviserId ? { adviserId: formData.adviserId } : {}),
      gradeLevel: Number(formData.gradeLevel),
      schoolYear: normalizedSchoolYear,
      curriculum: formData.curriculum,
      learningModality: formData.learningModality,
      room: formData.room || null,
      color: formData.color || null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        await fetchSections();
        setShowSectionModal(false);
        setAdviserSearch("");

        // * [SUCCESS] Section Updated
        openGeneralModal({
          title: "Section Updated",
          message: `"${formData.name}" has been updated successfully.`,
          type: "success",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      } else {
        if (!data.data?.created) {
          const reason = data.data?.failed?.[0]?.message || "The section could not be created.";
          setShowSectionModal(false);
          setAdviserSearch("");

          // ! [ERROR] Section Not Created
          openGeneralModal({
            title: "Section Not Created",
            message: `We couldn't create the section. ${reason}`,
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
          return;
        }
        await fetchSections();
        setShowSectionModal(false);
        setAdviserSearch("");

        // * [SUCCESS] Section Created
        openGeneralModal({
          title: "Section Created",
          message: `"${formData.name}" has been created successfully.`,
          type: "success",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      }
    } catch (err: any) {
      // ! [ERROR] Save Section Failed
      console.error(err);
      setShowSectionModal(false);
      setAdviserSearch("");
      openGeneralModal({
        title: isEditMode ? "Unable to Update Section" : "Unable to Create Section",
        message: "Something went wrong while saving the section. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Auto-Generate All Sections for a School Year
  const handleGenerate = async () => {
    const rawYear = generateYear.trim();
    const yearMatch = rawYear.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (!yearMatch) {
      setGenerateError('School year must be in "YYYY - YYYY" format (e.g. 2025 - 2026)');
      return;
    }
    const normalizedYear = normalizeSchoolYear(`${yearMatch[1]} - ${yearMatch[2]}`);

    setGenerating(true);
    setGenerateError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          schoolYear: normalizedYear,
          learningModality: "FACE_TO_FACE",
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Generation failed");

      const { created, skipped } = data.data;
      setShowGenerateModal(false);
      setGenerateYear("");
      await fetchSections();

      // * [SUCCESS] Sections Generated
      openGeneralModal({
        title: "Sections Generated",
        message: `${created.length} section(s) created across ${CURRICULUM_OPTIONS.length} curricula × 4 grade levels. ${skipped.length} already existed and were skipped.`,
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Generate Failed
      console.error(err);
      setGenerateError(err.message || "Something went wrong. Please try again.");
      openGeneralModal({
        title: "Unable to Generate Sections",
        message: "Something went wrong while generating sections. Please check your internet connection and try again.",
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setGenerating(false);
    }
  };

  // * [HANDLE] Sorting, Searching & Filtering
  const filteredSections = sections
    .filter(s =>
      (
        (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
        (s.curriculum && s.curriculum.toLowerCase().includes(search.toLowerCase())) ||
        (s.schoolYear && s.schoolYear.includes(search))
      ) &&
      (selectedGrade === "All" || String(s.gradeLevel) === selectedGrade)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":   return a.name.localeCompare(b.name);
        case "name-desc":  return b.name.localeCompare(a.name);
        case "grade-asc":  return Number(a.gradeLevel) - Number(b.gradeLevel);
        case "grade-desc": return Number(b.gradeLevel) - Number(a.gradeLevel);
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const displayedSections = filteredSections.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // * [BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Sections", path: null },
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

      {/* [MODAL] Section Form */}
      <SectionFormModal
        isOpen={showSectionModal}
        title={isEditMode ? "Edit Section" : "Create Section"}
        onClose={() => setShowSectionModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        advisers={advisers}
        adviserSearch={adviserSearch}
        setAdviserSearch={setAdviserSearch}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
        isEditMode={isEditMode}
      />

      {/* [MODAL] Auto-Generate Sections */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setGenerateError(""); setGenerateYear(""); }}
        title="Auto-Generate All Sections"
        type="default"
        confirmText={generating ? "Generating..." : "Generate"}
        onConfirm={handleGenerate}
        isCancelable={!generating}
      >
        <div className="p-1 space-y-4">
          {/* [INFO] Description */}
          <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-lg p-3 space-y-2">
            <p className="text-sm text-[var(--color-text-700)]">
              This will create <strong>one section per grade level × curriculum</strong> combination
              for the school year you specify — up to <strong>20 sections</strong> in total.
              Sections that already exist will be skipped.
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
              No adviser will be assigned — you can assign them afterwards.
            </p>
          </div>

          {/* [FIELD] School Year */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">
              School Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={generateYear}
              onChange={(e) => { setGenerateYear(e.target.value); setGenerateError(""); }}
              placeholder="e.g. 2025 - 2026"
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
            />
          </div>

          {/* [ERROR] Generate error */}
          {generateError && (
            <p className="text-xs text-red-600 font-medium">{generateError}</p>
          )}
        </div>
      </Modal>

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Sections" />
        }
        toolbar={
          <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg space-y-3 w-full">

            {/* [TOP ROW] Search + Filters (ALWAYS ONE LINE) */}
            <div className="flex items-center gap-2 w-full overflow-x-visible">

              {/* Search */}
              <div className="flex-1 min-w-[180px] sm:min-w-[240px] md:min-w-[320px] lg:min-w-[400px]">
                <SearchBar
                  value={search}
                  placeholder="Search by section name, curriculum, or school year"
                  onChange={setSearch}
                  onResetPage={() => setPage(1)}
                />
              </div>

              {/* Sort */}
              <div className="shrink-0">
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
              </div>

              {/* Filter */}
              <div className="shrink-0">
                <Dropdown
                  icon="/filter.svg"
                  label="Filter"
                  isOpen={activeDropdown === "grade"}
                  onToggle={() =>
                    setActiveDropdown(activeDropdown === "grade" ? null : "grade")
                  }
                  selected={selectedGrade}
                  onSelect={(value) => {
                    setSelectedGrade(value);
                    setPage(1);
                  }}
                  width="w-36"
                  options={[
                    { label: "All", value: "All" },
                    ...GRADE_LEVEL_OPTIONS.map(g => ({
                      label: `Grade ${g}`,
                      value: g
                    })),
                  ]}
                />
              </div>

            </div>

            {/* [BOTTOM ROW] Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <PrimaryButton
                text="Add Section"
                iconSrc="/add.svg"
                onClick={handleAddSection}
              />

              <SecondaryButton
                text="Auto-Generate Sections"
                iconSrc="/auto-generate.svg"
                onClick={() => {
                  setGenerateYear("");
                  setGenerateError("");
                  setShowGenerateModal(true);
                }}
              />
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

          {/* [SECTION] Section Cards (Mobile View) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {!loading && displayedSections.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No sections found"
                  subtitle="No sections match your current filters or search."
                />
              </div>
            )}

            {displayedSections.map((s) => (
              <SectionCard key={s.id} section={s} />
            ))}
          </div>

          {/* [SECTION] Sections Table (Desktop View) */}
          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {!loading && displayedSections.length === 0 && (
              <EmptyState
                title="No sections found"
                subtitle="No sections match your current filters or search."
              />
            )}

            {displayedSections.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    {/* [SECTION] Table Headers */}
                    <th className="table-header">Section</th>
                    <th className="table-header">Grade</th>
                    <th className="table-header">School Year</th>
                    <th className="table-header">Curriculum</th>
                    <th className="table-header">Adviser</th>
                    <th className="table-header">Students</th>
                  </tr>
                </thead>

                {/* [SECTION] Table Body */}
                <tbody>
                  {displayedSections.map((s) => (
                    <tr
                      key={s.id}
                      className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
                      onClick={() => navigate(`/admin/sections/view/${s.id}`)}
                    >
                      <td className="table-cell table-text table-text-link hover:underline">
                        {s.name}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        <Badge
                          label={`Grade ${s.gradeLevel}`}
                          color={getGradeColor(Number(s.gradeLevel))}
                        />
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {s.schoolYear}
                      </td>

                      <td className="table-cell">
                        {s.curriculum ? (
                          <Badge
                            label={s.curriculum}
                            color={
                              CURRICULUM_BADGE_MAP[s.curriculum] ?? "secondary"
                            }
                          />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="table-cell table-text">
                        {s.adviser ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/advisers/view/${s.adviser!.id}`);
                            }}
                            className="cursor-pointer hover:underline hover:text-[var(--color-primary-700)] transition"
                          >
                            {s.adviser.name}
                          </span>
                        ) : (
                          <Badge label="Unassigned" color="red" />
                        )}
                      </td>

                      <td className="table-cell table-text">
                        {s.classSize === 0 ? (
                          <Badge label="Empty" color="red" />
                        ) : (
                          <span className="table-text-default">
                            {s.classSize} student{s.classSize !== 1 ? "s" : ""}
                          </span>
                        )}
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

export default AdminSections;