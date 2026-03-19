import { useState, useEffect, useRef } from "react";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext"; // your modal context
import EmptyState from "../../components/EmptyState";

interface ScheduleItem {
  day: string;
  time: string;
}

interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  color: string;
  classSize: number;
  schedule: ScheduleItem[];
}

const AdviserClassManagement = () => {
  const { setShowTokenExpiredModal } = useAuth();

  const [classes, setClasses] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Centralized API response handler
  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      setShowTokenExpiredModal(true); // show modal
      return null;
    }
    return await res.json();
  };

  // Fetch adviser's sections from API
  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await handleApiResponse(res);
        if (!data) return; // token expired → modal shows automatically

        if (!data.success) {
          setError(data.message || "Failed to fetch sections");
          setClasses([]);
        } else {
          const sectionsWithDefaults: Section[] = data.data.map((sec: Section) => ({
            id: sec.id,
            name: `${sec.gradeLevel} — ${sec.name}`,
            gradeLevel: sec.gradeLevel,
            schoolYear: sec.schoolYear,
            color: sec.color || "#999999",
            classSize: sec.classSize || 0,
            schedule: sec.schedule || [],
          }));
          setClasses(sectionsWithDefaults);
        }
      } catch (err: unknown) {
        // Type guard: make sure err is an Error
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setShowTokenExpiredModal]);

  // Apply grade filter
  const filteredClasses = selectedGrade
    ? classes.filter((cls) => cls.gradeLevel.toString() === selectedGrade)
    : classes;

  return (
    <div className="py-10 px-4 space-y-4">
      {/* Header */}
      <div>
        <div className="bg-[var(--color-primary-700)] py-2 rounded-t-lg">
          <h1 className="text-center text-[var(--color-text-50)]">My Classes</h1>
        </div>
        <div className="bg-[var(--color-primary-600)] py-2 rounded-b-lg">
          <h4 className="text-center text-[var(--color-text-50)]">S.Y. 2025–2026</h4>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search classes..."
            className="w-full bg-[var(--color-bg-50)] font-roboto rounded-sm py-2 pl-4 pr-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
          />
        </div>
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm p-2 border transition cursor-pointer ${
              showFilters
                ? "bg-[var(--color-primary-600)] border-[var(--color-primary-500)]"
                : "bg-[var(--color-primary-700)] border-[var(--color-primary-700)] hover:opacity-80"
            }`}
          >
            <img src="/filter-icon.svg" alt="Filter" className="w-5 h-5" />
          </button>

          {showFilters && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-50)] border border-[var(--color-bg-300)] rounded-md shadow-lg p-3 space-y-2 z-50">
              <p className="font-roboto font-bold text-sm text-[var(--color-text-700)]">Filter by Grade</p>
              <button
                onClick={() => {
                  setSelectedGrade(null);
                  setShowFilters(false);
                }}
                className={`font-roboto font-semibold text-sm w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${
                  selectedGrade === null ? "bg-[var(--color-primary-200)]" : ""
                }`}
              >
                All
              </button>
              {["7", "8", "9", "10"].map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade);
                    setShowFilters(false);
                  }}
                  className={`font-roboto text-sm w-full text-left px-2 py-1 rounded hover:bg-[var(--color-bg-200)] ${
                    selectedGrade === grade ? "bg-[var(--color-primary-200)]" : ""
                  }`}
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 space-y-8 py-4">
        {loading && <p className="text-center text-[var(--color-text-500)]">Loading classes...</p>}

        {/* No sections */}
        {!loading && classes.length === 0 && !error && (
          <EmptyState
            title="No sections found for this adviser"
            subtitle="You currently have no assigned sections. Please contact admin if this is an error."
            iconSrc="/no-data-icon.svg"
          />
        )}

        {/* API or fetch errors */}
        {!loading && error && (
          <EmptyState
            title="Error fetching sections"
            subtitle={error}
            iconSrc="/error-icon.svg"
          />
        )}

        {/* Render class cards */}
        {!loading &&
          !error &&
          classes.length > 0 &&
          filteredClasses.map((cls) => (
            <ClassCard
              id={cls.id}
              key={cls.id}
              name={cls.name}
              schedule={cls.schedule}
              classSize={cls.classSize}
              color={cls.color}
            />
          ))}

        {/* Filters applied but no matching classes */}
        {!loading &&
          !error &&
          classes.length > 0 &&
          filteredClasses.length === 0 && (
            <EmptyState
              title="No classes match the selected grade"
              subtitle="Try selecting a different grade or clear the filter."
              iconSrc="/no-data-icon.svg"
            />
          )}
      </div>
    </div>
  );
};

export default AdviserClassManagement;