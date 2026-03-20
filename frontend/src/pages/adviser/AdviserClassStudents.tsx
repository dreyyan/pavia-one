import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MyClassCard from "../../components/MyClassCard";
import { useAuth } from "../../context/AuthContext"; // Make sure you have this

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
  const { sectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("lrn-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // [EFFECT] Preload images
  useEffect(() => {
    const assetsToPreload = [
      "/class-size-icon.svg",
      "/present-today-icon.svg",
      "/pending-tasks-icon.svg",
      "/view-students-icon.svg",
      "/attendance-icon.svg",
      "/grades-icon.svg",
      "/reports-icon.svg",
      "/filter-icon.svg",
      "/no-data-icon.svg",
      "/default-profile.svg",
    ];

    assetsToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    // Centralized API response handler
    const handleApiResponse = async (res: Response) => {
      if (res.status === 401) {
        setShowTokenExpiredModal(true); // Show modal for expired token
        return null;
      }
      return await res.json();
    };

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

        const data = await handleApiResponse(res);
        if (!data) return; // token expired → modal will show automatically

        if (!data.success) {
          setError(data.message || "Failed to fetch data");
          setStudents([]);
          setSection(null);
          return;
        }

        const studentsData: Student[] = data.data?.students || [];
        setStudents(studentsData);

        // Calculate male/female counts
        let maleCount = 0;
        let femaleCount = 0;
        studentsData.forEach((s: Student) => {
          if (s.sex === "MALE") maleCount++;
          else if (s.sex === "FEMALE") femaleCount++;
        });

        const sec = data.data?.section;
        if (sec) {
          setSection({
            id: sec.id,
            name: `${sec.gradeLevel} — ${sec.name}`,
            gradeLevel: sec.gradeLevel,
            classSize: studentsData.length,
            color: sec.color || "#999999",
            schedule: sec.schedule || [],
            maleCount,
            femaleCount,
          });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Something went wrong");
        setError(error.message);
        setStudents([]);
        setSection(null);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchData();
  }, [sectionId, setShowTokenExpiredModal]);

  // Filtered and sorted students
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
      }
    });

  if (loading) return <p>Loading students...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!section) return <p>No section found.</p>;

  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section.name, path: `/adviser/classes/${sectionId}` },
    { label: "View Students", path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-4 relative">
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            {crumb.path ? (
              <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>
                {crumb.label}
              </span>
            ) : (
              <span className="font-roboto font-medium text-[var(--color-text-900)]">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      <MyClassCard
        id={section.id}
        key={section.id}
        name={section.name}
        classSize={section.classSize}
        maleCount={section.maleCount ?? 0}
        femaleCount={section.femaleCount ?? 0}
        color={section.color}
      />
      
      {/* Search & Sort */}
      <div className="flex items-center gap-4 mt-4">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by LRN or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-bg-50)] font-roboto rounded-sm py-2 pl-4 pr-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
          />
        </div>

        {/* Sort dropdown */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm p-2 border transition cursor-pointer ${
              showSortFilters
                ? "bg-[var(--color-primary-600)] border-[var(--color-primary-500)]"
                : "bg-[var(--color-primary-700)] border-[var(--color-primary-700)] hover:opacity-80"
            }`}
          >
            <img src="/filter-icon.svg" alt="Sort" className="w-5 h-5" />
          </button>

          {showSortFilters && (
            <div className="absolute right-0 mt-2 w-40 bg-[var(--color-bg-50)] border border-[var(--color-bg-300)] rounded-md shadow-lg p-2 space-y-1 z-50">
              <button
                onClick={() => { setSortOption("lrn-asc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 font-roboto text-sm rounded hover:bg-[var(--color-bg-200)] ${
                  sortOption === "lrn-asc" ? "bg-[var(--color-primary-200)]" : ""
                }`}
              >
                LRN ↑
              </button>
              <button
                onClick={() => { setSortOption("lrn-desc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 font-roboto text-sm rounded hover:bg-[var(--color-bg-200)] ${
                  sortOption === "lrn-desc" ? "bg-[var(--color-primary-200)]" : ""
                }`}
              >
                LRN ↓
              </button>
              <button
                onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 font-roboto text-sm rounded hover:bg-[var(--color-bg-200)] ${
                  sortOption === "name-asc" ? "bg-[var(--color-primary-200)]" : ""
                }`}
              >
                Name ↑
              </button>
              <button
                onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${
                  sortOption === "name-desc" ? "bg-[var(--color-primary-200)]" : ""
                }`}
              >
                Name ↓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto mt-4 rounded-lg">
        {displayedStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-center text-[var(--color-text-800)]">
            <img src="/no-data-icon.svg" alt="No students" className="size-16" />
            <p className="font-roboto font-semibold text-lg">No students found</p>
            <p className="font-roboto text-sm text-[var(--color-text-700)]">
              Try searching for a different LRN or student name.
            </p>
          </div>
        )}

        {displayedStudents.length > 0 && (
          <table className="min-w-full bg-white shadow-md table-auto border-collapse">
            <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
              <tr>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] w-28 truncate">
                  LRN
                </th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)]">
                  Full Name
                </th>
                <th className="py-2 px-4 text-left hidden sm:table-cell border-r border-[var(--color-primary-600)]">
                  Profile
                </th>
                <th className="py-2 px-4 text-left hidden md:table-cell">
                  Attendance
                </th>
              </tr>
            </thead>

            <tbody className="font-roboto">
              {displayedStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-[var(--color-bg-100)] hover:bg-[var(--color-bg-50)] cursor-pointer transition-color duration-200 ease-in-out"
                  onClick={() => navigate(`/adviser/classes/${sectionId}/students/${student.id}`)}
                >
                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] w-28 truncate">
                    {student.lrn}
                  </td>
                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] font-bold border-r border-[var(--color-bg-300)] truncate max-w-[150px]">
                    {student.fullName}
                  </td>
                  <td className="py-2 px-4 text-[var(--color-text-900)] hidden sm:table-cell border-r border-[var(--color-bg-300)]">
                    <img
                      src={student.profilePic || "/default-profile.svg"}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                  </td>
                  <td className="py-2 px-4 hidden md:table-cell">{student.attendanceRate ?? 0}%</td>
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