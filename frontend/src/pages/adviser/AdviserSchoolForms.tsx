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
import SearchBar from "../../components/toolbar/SearchBar";
import Dropdown from "../../components/toolbar/Dropdown";
import Pagination from "../../components/toolbar/Pagination";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";
import SectionSchoolFormCard from "../../components/cards/section/SectionSchoolFormCard";

// [IMPORT] Helpers, Constants & Types
import { getVisiblePages } from "../../helpers/index";
import { GRADE_LEVEL_OPTIONS } from "../../constants";
import { GeneralModalConfig, Section } from "../../types";

type SortOption = "name-asc" | "name-desc" | "grade-asc" | "grade-desc";

const AdviserSchoolForms = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES] Entities
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "filter" | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

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

  // * [HANDLE] Fetch Sections with School Forms
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections?includeForms=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch sections");

      setSections(
        (data.data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          gradeLevel: s.gradeLevel,
          schoolYear: s.schoolYear,
          color: s.color || "#6366f1",
          classSize: s.classSize || 0,
          schoolForms: s.schoolForms || [],
        }))
      );
    } catch (err: any) {
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

  useEffect(() => {
    fetchSections();
  }, []);

  // * [COMPUTE] Filtered & sorted sections
  const filteredSections = sections
    .filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.schoolYear?.toLowerCase() ?? "").includes(search.toLowerCase());
      const matchesGrade =
        selectedGrades.length === 0 || selectedGrades.includes(String(s.gradeLevel));
      return matchesSearch && matchesGrade;
    })
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

  // * [BREADCRUMBS] Adviser School Forms navigation
  const breadcrumbs = [
    { label: "Adviser Dashboard", path: "/adviser/dashboard" },
    { label: "School Forms", path: null },
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
        header={<Breadcrumbs items={breadcrumbs} title="School Forms" />}
        toolbar={
          <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 md:gap-4 w-full">
                {/* [COMPONENT] Search Bar */}
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={search}
                    placeholder="Search by section name or school year..."
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
                      { label: "Name ↑", value: "name-asc" },
                      { label: "Name ↓", value: "name-desc" },
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
                    width="w-40"
                    selectedValues={selectedGrades}
                    onSelectMultiple={(v) => { setSelectedGrades(v); setPage(1); }}
                    options={GRADE_LEVEL_OPTIONS.map(g => ({ label: `Grade ${g}`, value: String(g) }))}
                  />
                </div>
              </div>
            </div>
          </div>
        }
        footer={
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            getVisiblePages={getVisiblePages}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {displayedSections.length === 0 ? (
            <div className="sm:col-span-2 flex justify-center">
              <EmptyState
                title={sections.length === 0 ? "No sections assigned" : "No sections found"}
                subtitle={
                  sections.length === 0
                    ? "You have no advisory sections. Contact the administrator if this is an error."
                    : "No sections match your current search or filters."
                }
              />
            </div>
          ) : (
            displayedSections.map(section => (
              <SectionSchoolFormCard
                key={section.id}
                section={section}
                onClick={() => navigate(`/adviser/school-forms/${section.id}`)}
              />
            ))
          )}
        </div>
      </PageLayout>
    </>
  );
};

export default AdviserSchoolForms;