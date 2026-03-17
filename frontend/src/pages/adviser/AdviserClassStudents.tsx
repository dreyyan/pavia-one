import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MyClassCard from "../../components/MyClassCard";

interface Student {
  id: number;
  lrn: string;
  fullName: string;
  profilePic?: string;
  attendanceRate?: number;
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
}

type SortOption = "lrn-asc" | "lrn-desc" | "name-asc" | "name-desc";

const AdviserClassStudents = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("lrn-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${id}/students`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Failed to fetch data");
          setStudents([]);
          setSection(null);
        } else {
          // Set students
          setStudents(data.data?.students || []);

          // Map section info for MyClassCard
          const sec = data.data?.section;
          if (sec) {
            setSection({
              id: sec.id,
              name: `${sec.gradeLevel} — ${sec.name}`,
              gradeLevel: sec.gradeLevel,
              classSize: data.data?.students?.length || 0,
              color: sec.color || "#999999",
              schedule: sec.schedule || [],
            });
          }
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setStudents([]);
        setSection(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowSortFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered and sorted students
  const displayedStudents = students
    .filter((s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.lrn.includes(search)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "lrn-asc":
          return a.lrn.localeCompare(b.lrn);
        case "lrn-desc":
          return b.lrn.localeCompare(a.lrn);
        case "name-asc":
          return a.fullName.localeCompare(b.fullName);
        case "name-desc":
          return b.fullName.localeCompare(a.fullName);
      }
    });

  if (loading) return <p>Loading students...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!section) return <p>No section found.</p>;

  return (
    <div className="py-8 px-4 space-y-4 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/adviser/classes/${id}`)}
        className="fixed top-20 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] 
                   text-[var(--color-text-50)] font-semibold rounded-full shadow-lg hover:bg-[var(--color-primary-500)] 
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Section Card */}
      <MyClassCard
        id={section.id}
        key={section.id}
        name={section.name}
        schedule={section.schedule}
        classSize={section.classSize}
        color={section.color}
      />

      {/* Search & Sort */}
      <div className="flex items-center gap-4 mt-4">
        <input
          type="text"
          placeholder="Search by LRN or Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[var(--color-bg-100)] border border-[var(--color-bg-400)] rounded-sm py-2 pl-4 pr-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
        />

        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className="flex items-center justify-center bg-[var(--color-primary-700)] border border-[var(--color-primary-700)] p-2 rounded-sm hover:opacity-80 transition"
          >
            <img src="/filter-icon.svg" alt="Sort" className="w-5 h-5" />
          </button>

          {showSortFilters && (
            <div className="absolute right-0 mt-2 w-40 bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-md shadow-lg p-2 space-y-1 z-50">
              <button
                onClick={() => { setSortOption("lrn-asc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${sortOption==="lrn-asc"?"bg-[var(--color-primary-200)]":""}`}
              >
                LRN ↑
              </button>
              <button
                onClick={() => { setSortOption("lrn-desc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${sortOption==="lrn-desc"?"bg-[var(--color-primary-200)]":""}`}
              >
                LRN ↓
              </button>
              <button
                onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${sortOption==="name-asc"?"bg-[var(--color-primary-200)]":""}`}
              >
                Name ↑
              </button>
              <button
                onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${sortOption==="name-desc"?"bg-[var(--color-primary-200)]":""}`}
              >
                Name ↓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto mt-4 rounded-lg">
        {displayedStudents.length === 0 && <p>No students found.</p>}

        {displayedStudents.length > 0 && (
            <table className="min-w-full bg-white shadow-md table-auto">
            <thead className="bg-[var(--color-primary-600)] text-white">
                <tr>
                <th className="py-2 px-4 text-left font-medium">LRN</th>
                <th className="py-2 px-4 text-left font-bold">Full Name</th>
                <th className="py-2 px-4 text-left hidden sm:table-cell">Profile</th>
                <th className="py-2 px-4 text-left hidden md:table-cell">Attendance</th>
                </tr>
            </thead>
            <tbody>
                {displayedStudents.map((student) => (
                <tr
                    key={student.id}
                    className="border-t border-[var(--color-bg-200)] hover:bg-[var(--color-bg-100)] cursor-pointer"
                    onClick={() => navigate(`/adviser/students/${student.id}`)}
                >
                    <td className="py-2 px-4 text-[var(--color-text-900)] font-medium">{student.lrn}</td>
                    <td className="py-2 px-4 text-[var(--color-text-900)] font-bold">{student.fullName}</td>
                    <td className="py-2 px-4 text-[var(--color-text-900)] hidden sm:table-cell">
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