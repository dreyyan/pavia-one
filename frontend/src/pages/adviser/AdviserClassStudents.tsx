/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import SearchBar from "../../components/SearchBar";
import Dropdown from "../../components/Dropdown";
import Pagination from "../../components/Pagination";
import Breadcrumbs from "../../components/Breadcrumbs";
import StudentCard from "../../components/cards/StudentCard";
import PageLayout from "../../components/layouts/PageLayout";
import ClassCard from "../../components/cards/ClassCard";

// [IMPORT] Constants, Helpers & Types
import { getVisiblePages } from "../../helpers/index";
import { Student, Section } from "../../types";

type SortOption = "name-asc" | "name-desc" | "lrn-asc" | "lrn-desc";

const AdviserClassStudents = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [students, setStudents] = useState<Student[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | null>(null);

  type SortOptionType = SortOption;
  const [sortOption, setSortOption] = useState<SortOptionType>("name-asc");

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // * [HANDLE] Fetch Section and Students
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students`,
        {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();

      if (!data.success || !data.data) {
        setStudents([]);
        setSection(null);
        return;
      }

      const { students: studentsData = [], section: sec } = data.data;

      setStudents(studentsData);

      setSection({
        id: Number(sectionId),
        name: sec.name,
        gradeLevel: sec.gradeLevel,
        classSize: data.data.pagination.total,
        curriculum: sec.curriculum ?? "—",
        color: sec.sectionColor || "#999999",
        maleCount: sec.maleCount,
        femaleCount: sec.femaleCount,
      });
    } catch (err) {
      // ! [ERROR] Fetching students failed
      console.error(err);
      setStudents([]);
      setSection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) fetchData();
  }, [sectionId]);

  // * [COMPUTE] Filtered & sorted students
  const filteredStudents = students
    .filter(s =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.lrn.includes(search)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":  return a.fullName.localeCompare(b.fullName);
        case "name-desc": return b.fullName.localeCompare(a.fullName);
        case "lrn-asc":  return a.lrn.localeCompare(b.lrn);
        case "lrn-desc": return b.lrn.localeCompare(a.lrn);
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const displayedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // * [BREADCRUMBS] Adviser Class Students navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section?.name || "Class", path: `/adviser/classes/${sectionId}` },
    { label: "Students", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  if (!section) {
    return (
      <PageLayout header={<Breadcrumbs items={breadcrumbs} title="Students" />}>
        <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
          <p className="text-sm font-roboto text-[var(--color-text-600)]">Section not found.</p>
          <button
            onClick={() => navigate("/adviser/classes")}
            className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
          >
            ← Back to Classes
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={<Breadcrumbs items={breadcrumbs} title="Students" />}
      card={
        <div>
          {/* [COMPONENT] Class Card */}
          <ClassCard
            id={section.id}
            name={section.name}
            classSize={section.classSize}
            curriculum={section.curriculum}
            gradeLevel={section.gradeLevel}
          />
        </div>
      }
      toolbar={
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

              {/* [COMPONENT] Sort Dropdown */}
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
                    setSortOption(value as SortOptionType);
                    setPage(1);
                  }}
                  options={[
                    { label: "Name (A → Z)", value: "name-asc" },
                    { label: "Name (Z → A)", value: "name-desc" },
                    { label: "LRN ↑", value: "lrn-asc" },
                    { label: "LRN ↓", value: "lrn-desc" },
                  ]}
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
      <div className="space-y-3">
        {/* [SECTION] Student Cards (Mobile View) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {displayedStudents.length === 0 && (
            <div className="sm:col-span-2 flex justify-center">
              <EmptyState
                title="No students found"
                subtitle="No students match your current search."
              />
            </div>
          )}
          {displayedStudents.map(s => (
            <StudentCard
              key={s.id}
              student={s}
              onClick={() => navigate(`/adviser/classes/${sectionId}/students/${s.id}`)}
            />
          ))}
        </div>

        {/* [SECTION] Students Table (Desktop View) */}
        <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
          {displayedStudents.length === 0 && (
            <EmptyState
              title="No students found"
              subtitle="No students match your current search."
            />
          )}

          {displayedStudents.length > 0 && (
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left">
                  <th className="table-header">Name</th>
                  <th className="table-header">LRN</th>
                  <th className="table-header">Sex</th>
                  {/* <th className="table-header">Attendance</th> */}
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map(s => (
                  <tr
                    key={s.id}
                    className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
                    onClick={() => navigate(`/adviser/classes/${sectionId}/students/${s.id}`)}
                  >
                    <td className="table-cell table-text table-text-link hover:underline">
                      {s.fullName}
                    </td>
                    <td className="table-cell table-text table-text-default font-mono text-xs">
                      {s.lrn}
                    </td>
                    <td className="table-cell table-text table-text-default">
                      {s.sex === "MALE" ? "M" : s.sex === "FEMALE" ? "F" : "—"}
                    </td>
                    {/* TODO: Implement attendance rate display */}
                    {/* <td className="table-cell table-text table-text-default">
                      {s.attendanceRate ?? 0}%
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </PageLayout>
  );
};

export default AdviserClassStudents;