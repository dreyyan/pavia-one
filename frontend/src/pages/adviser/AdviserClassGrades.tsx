/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import SearchBar from "../../components/toolbar/SearchBar";
import Dropdown from "../../components/toolbar/Dropdown";
import Pagination from "../../components/toolbar/Pagination";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import ClassCard from "../../components/cards/class/ClassCard";
import StudentGradeCard from "../../components/cards/student/StudentGradeCard";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Helpers & Types
import { getVisiblePages } from "../../helpers";
import { GeneralModalConfig, StudentGrade, SectionUI, Enrollment } from "../../types";

export type EnrollmentWithStudent = Enrollment & {
  student?: { sex?: "MALE" | "FEMALE" | null } | null;
};

type SortOption = "name-asc" | "name-desc" | "lrn-asc" | "lrn-desc";

const AdviserClassGrades = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [section, setSection] = useState<SectionUI | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "filter" | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [selectedSexes, setSelectedSexes] = useState<string[]>([]);

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

  // * [HANDLE] Fetch Section Info and Grades
  const fetchGrades = async () => {
    if (!sectionId) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // [FETCH] Section info
      const resSection = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );

      if (resSection.status === 401) { setShowTokenExpiredModal(true); return; }

      const sectionData = await resSection.json();
      if (!sectionData?.success) throw new Error("Failed to fetch section");

      const sec = sectionData.data;

      // [COMPUTE] Male / female counts from enrollments
      let maleCount = 0;
      let femaleCount = 0;
      (sec.enrollments || []).forEach((e: EnrollmentWithStudent) => {
        if (e.student?.sex === "MALE") maleCount++;
        if (e.student?.sex === "FEMALE") femaleCount++;
      });

      setSection({
        id: sec.id,
        gradeLevel: Number(sec.gradeLevel),
        name: sec.name,
        classSize: sec.classSize ?? maleCount + femaleCount,
        maleCount,
        femaleCount,
        color: sec.color ?? "#999999",
      });

      // [FETCH] Student grades
      const resGrades = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/section/${sectionId}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );

      const gradesData = await resGrades.json();
      if (!gradesData?.success) throw new Error("Failed to fetch grades");

      setGrades(gradesData.data || []);
    } catch (err) {
      // ! [ERROR] Fetching grades failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Grades",
        message: "We couldn't load the grades at the moment. Please try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [sectionId]);

  // * [COMPUTE] Filtered & sorted grades
  const filteredGrades = grades
    .filter(s => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.lrn.includes(search);
      const matchesSex =
        selectedSexes.length === 0 ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectedSexes.includes((s as any).sex);
      return matchesSearch && matchesSex;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":  return a.fullName.localeCompare(b.fullName);
        case "name-desc": return b.fullName.localeCompare(a.fullName);
        case "lrn-asc":   return a.lrn.localeCompare(b.lrn);
        case "lrn-desc":  return b.lrn.localeCompare(a.lrn);
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const displayedGrades = filteredGrades.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // [DERIVED] Section
  const sectionLabel = section
    ? `${section.gradeLevel} — ${section.name}`
    : "Class";

  // * [BREADCRUMBS] Adviser Class Grades navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: sectionLabel || "Class", path: `/adviser/classes/${sectionId}` },
    { label: "Grades", path: null },
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
        header={<Breadcrumbs items={breadcrumbs} title={`Grades (${sectionLabel})`} />}
        toolbar={
          <div className="space-y-3">
            {/* [COMPONENT] Class Card */}
            {section && (
              <ClassCard
                id={section.id}
                name={section.name}
                classSize={section.classSize}
                maleCount={section.maleCount}
                femaleCount={section.femaleCount}
                gradeLevel={section.gradeLevel}
              />
            )}

            {/* [TOOLBAR] Search + Sort + Filter */}
            <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
                <div className="flex items-stretch gap-2 md:gap-4 w-full">
                  {/* [COMPONENT] Search Bar */}
                  <div className="w-full sm:w-64 md:w-80 lg:w-96">
                    <SearchBar
                      value={search}
                      placeholder="Search by name or LRN..."
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
                      onSelect={(v) => { setSortOption(v as SortOption); setPage(1); }}
                      options={[
                        { label: "Name (A → Z)", value: "name-asc" },
                        { label: "Name (Z → A)", value: "name-desc" },
                        { label: "LRN ↑", value: "lrn-asc" },
                        { label: "LRN ↓", value: "lrn-desc" },
                      ]}
                    />
                    <Dropdown
                      icon="/filter.svg"
                      label="Filter"
                      isOpen={activeDropdown === "filter"}
                      onToggle={() =>
                        setActiveDropdown(activeDropdown === "filter" ? null : "filter")
                      }
                      groups={[
                        {
                          label: "Sex",
                          options: [
                            { label: "Male", value: "MALE" },
                            { label: "Female", value: "FEMALE" },
                          ],
                          selectedValues: selectedSexes,
                          onSelectMultiple: (v) => { setSelectedSexes(v); setPage(1); },
                        },
                      ]}
                    />
                  </div>
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
        <div className="space-y-3">

          {/* [SECTION] Grade Cards (Mobile View) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {displayedGrades.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No grades available"
                  subtitle="Grades will appear here once they have been uploaded."
                />
              </div>
            )}
            {displayedGrades.map(student => (
              <StudentGradeCard
                key={student.id}
                student={student}
                onClick={() => navigate(`/adviser/classes/${sectionId}/grades/${student.id}`)}
              />
            ))}
          </div>

          {/* [SECTION] Grades Table (Desktop View) */}
          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {displayedGrades.length === 0 && (
              <EmptyState
                title="No grades available"
                subtitle="Grades will appear here once they have been uploaded."
              />
            )}
            {displayedGrades.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="table-header">LRN</th>
                    <th className="table-header">Full Name</th>
                    <th className="table-header">Average</th>
                    <th className="table-header">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedGrades.map(student => (
                    <tr
                      key={student.id}
                      className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
                      onClick={() => navigate(`/adviser/classes/${sectionId}/grades/${student.id}`)}
                    >
                      <td className="table-cell table-text table-text-default font-mono text-xs">
                        {student.lrn}
                      </td>
                      <td className="table-cell table-text table-text-link hover:underline">
                        {student.fullName}
                      </td>
                      <td className="table-cell table-text table-text-default">
                        {student.average ?? "—"}
                      </td>
                      <td className="table-cell table-text table-text-default">
                        {student.remarks ?? "—"}
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

export default AdviserClassGrades;