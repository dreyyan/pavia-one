/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ClassCard from "../../components/ClassCard";

// ? [INTERFACES]
interface Student {
  id: number;
  lrn: string;
  fullName: string;
  profilePic?: string;
  attendanceRate?: number;
  sex?: string;
}

interface ScheduleItem {
  day: string;
  time: string;
}

interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  classSize: number;
  color: string;
  schedule: ScheduleItem[];
  maleCount?: number;
  femaleCount?: number;
}

type SortOption = "lrn-asc" | "lrn-desc" | "name-asc" | "name-desc";

const AdviserClassStudents = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [students, setStudents] = useState<Student[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // * [EFFECT] Fetch section and students
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        if (!data.success || !data.data) {
          setError(data?.message || "Failed to fetch students or section");
          setStudents([]);
          setSection(null);
          return;
        }

        const { students: studentsData = [], section: sec } = data.data;

        if (!sec) {
          setError("Section not found");
          setStudents([]);
          setSection(null);
          return;
        }

        setStudents(studentsData);

        // Calculate male/female counts
        let maleCount = 0;
        let femaleCount = 0;
        studentsData.forEach((s: Student) => {
          if (s.sex === "MALE") maleCount++;
          else if (s.sex === "FEMALE") femaleCount++;
        });

        setSection({
          id: Number(sectionId),
          name: `${sec.gradeLevel} — ${sec.name}`,
          gradeLevel: sec.gradeLevel,
          classSize: studentsData.length,
          color: sec.sectionColor || "#999999",
          schedule: sec.schedule || [],
          maleCount,
          femaleCount,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Something went wrong";
        setError(errorMsg);
        setStudents([]);
        setSection(null);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchData();
  }, [sectionId, setShowTokenExpiredModal]);

  // * [HANDLE] Sorting and Searching
  const displayedStudents = students
    .filter((s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.lrn.includes(search)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "lrn-asc": return a.lrn.localeCompare(b.lrn);
        case "lrn-desc": return b.lrn.localeCompare(a.lrn);
        case "name-asc": return a.fullName.localeCompare(b.fullName);
        case "name-desc": return b.fullName.localeCompare(a.fullName);
        default: return 0;
      }
    });

  // [BREADCRUMBS]
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section?.name || "Class", path: `/adviser/classes/${sectionId}` },
    { label: "Students", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="py-10 px-4">
        <p className="text-[var(--color-red-600)] font-medium">{error}</p>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="py-10 px-4">
        <p className="text-[var(--color-text-700)]">No section found.</p>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 space-y-4 relative">
      {/* [SECTION] Header & Breadcrumbs */}
      <div>
        {/* [UI] Header */}
        <h2 className="text-[var(--color-text-800)] leading-0">Students</h2>

        {/* [UI] Breadcrumbs */}
        <nav className="font-roboto text-sm text-[var(--color-text-700)]">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx}>
              {crumb.path ? (
                <span 
                  className="cursor-pointer hover:underline" 
                  onClick={() => navigate(crumb.path!)}
                >
                  {crumb.label}
                </span>
              ) : (
                <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && " / "}
            </span>
          ))}
        </nav>
      </div>

      {/* [COMPONENT] My Class Card */}
      <div className="py-2">
        <ClassCard
          id={section.id}
          name={section.name}
          classSize={section.classSize}
          maleCount={section.maleCount ?? 0}
          femaleCount={section.femaleCount ?? 0}
          color={section.color}
        />
      </div>

      {/* [SECTION] Search & Filters */}
      <div className="bg-[var(--color-bg-100)] px-3 rounded-lg py-4 flex gap-2 md:gap-4 items-stretch w-full">
        {/* [INPUT] Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name or LRN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
          />
        </div>

        {/* [DROPDOWN] Sort Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer ${
              showSortFilters ? "bg-[var(--color-bg-50)]" : "bg-[var(--color-bg-50)] hover:opacity-80"
            }`}
          >
            <img src="/sort-icon.svg" alt="Sort" className="size-4" />
          </button>

          {showSortFilters && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button 
                onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }} 
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}
              >
                Name ↑
              </button>
              <button 
                onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }} 
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}
              >
                Name ↓
              </button>
              <button 
                onClick={() => { setSortOption("lrn-asc"); setShowSortFilters(false); }} 
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "lrn-asc" ? "bg-blue-100" : ""}`}
              >
                LRN ↑
              </button>
              <button 
                onClick={() => { setSortOption("lrn-desc"); setShowSortFilters(false); }} 
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "lrn-desc" ? "bg-blue-100" : ""}`}
              >
                LRN ↓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* [CARDS] Students - Mobile View (Consistent with AdminStudents) */}
      <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
        {displayedStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            subtitle="No students match your current search. Try adjusting your criteria."
            iconSrc="/no-data-icon.svg"
          />
        ) : (
          displayedStudents.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/adviser/classes/${sectionId}/students/${s.id}`)}
            >
              {/* Header */}
              <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
                <div className="flex items-center w-full gap-3 min-w-0">
                  {/* Initials Avatar */}
                  <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold px-4 text-xl border border-[var(--color-primary-200)] flex-shrink-0">
                    {s.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  {/* Name + LRN */}
                  <div className="flex-1 min-w-0">
                    <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
                      {s.fullName}
                    </p>
                    <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
                      LRN <span className="font-semibold text-[var(--color-text-700)]">{s.lrn}</span>
                    </p>
                  </div>

                  {/* Sex Badge */}
                  <div className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                    s.sex === "MALE"
                      ? "bg-[var(--color-primary-100)] text-[var(--color-primary-500)]"
                      : s.sex === "FEMALE"
                        ? "bg-[var(--color-red-100)] text-[var(--color-red-500)]"
                        : "bg-[var(--color-bg-100)] text-gray-600"
                  }`}>
                    {s.sex === "MALE" ? "M" : s.sex === "FEMALE" ? "F" : "—"}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Attendance</span>
                  <span className="text-[var(--color-text-900)]">
                    {s.attendanceRate ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* [SECTION] Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto mt-2 bg-[var(--color-bg-100)] rounded-lg">
        {displayedStudents.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No students found"
              subtitle="No students match your current search. Try adjusting your criteria."
              iconSrc="/no-data-icon.svg"
            />
          </div>
        ) : (
          <table className="min-w-full bg-white shadow-md table-auto border-collapse">
            <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
              <tr>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] w-28 truncate">
                  LRN
                </th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)]">
                  Full Name
                </th>
                <th className="py-2 px-4 text-left hidden md:table-cell border-r border-[var(--color-primary-600)]">
                  Profile
                </th>
                <th className="py-2 px-4 text-left hidden lg:table-cell">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="font-roboto">
              {displayedStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-[var(--color-bg-100)] hover:bg-[var(--color-bg-50)] cursor-pointer transition-colors duration-200"
                  onClick={() => navigate(`/adviser/classes/${sectionId}/students/${student.id}`)}
                >
                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] w-28 truncate">
                    {student.lrn}
                  </td>
                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] font-bold border-r border-[var(--color-bg-300)] truncate">
                    {student.fullName}
                  </td>
                  <td className="py-2 px-4 hidden md:table-cell border-r border-[var(--color-bg-300)]">
                    <img
                      src={student.profilePic || "/default-profile.svg"}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </td>
                  <td className="py-2 px-4 hidden lg:table-cell text-[var(--color-text-900)]">
                    {student.attendanceRate ?? 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdviserClassStudents;