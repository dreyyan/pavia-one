/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import ClassCard from "../../components/ClassCard";
import EmptyState from "../../components/EmptyState";
import Skeleton from "../../components/Skeleton";

// [IMPORT] Constants
import { CURRICULUM_OPTIONS } from "./../../constants/index";

// ? [INTERFACES]
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
  curriculum?: string;
}

const AdviserClassManagement = () => {
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [classes, setClasses] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [showGradeFilters, setShowGradeFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // [EFFECT] Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowGradeFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // * [EFFECT] Fetch adviser's sections
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

        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Failed to fetch sections");
          setClasses([]);
          return;
        }

        const sectionsWithDefaults: Section[] = data.data.map((sec: any) => {
        // Map curriculum value to label for display
        const curriculumLabel =
          CURRICULUM_OPTIONS.find((c) => c.value === sec.curriculum)?.label || "";
          
          return {
            id: sec.id,
            name: `${sec.gradeLevel} — ${sec.name}`,
            gradeLevel: sec.gradeLevel,
            schoolYear: sec.schoolYear,
            color: sec.color || "#999999",
            classSize: sec.classSize || 0,
            schedule: sec.schedule || [],
            curriculum: curriculumLabel
          }
        });

        setClasses(sectionsWithDefaults);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Something went wrong";
        setError(errorMsg);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [setShowTokenExpiredModal]);

  // * [HANDLE] Search & Filter
  const filteredClasses = classes
    .filter((cls) => {
      const matchesSearch = cls.name.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = !selectedGrade || cls.gradeLevel.toString() === selectedGrade;
      return matchesSearch && matchesGrade;
    });

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  return (
    <div className="py-10 px-4 space-y-4">
      {/* [SECTION] Header & Breadcrumbs */}
      <div>
        <h2 className="text-[var(--color-text-800)] leading-0">Class Management</h2>
      </div>

      {/* [SECTION] Search & Filters */}
      <div className="bg-[var(--color-bg-100)] px-3 rounded-lg py-4 flex md:flex-row gap-2 md:gap-4 items-stretch w-full">
        {/* [INPUT] Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by section name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
          />
        </div>

        {/* [DROPDOWN] Grade Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowGradeFilters(!showGradeFilters)}
            className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
          >
            <img src="/filter-icon.svg" alt="Filter" className="size-4" />
          </button>

          {showGradeFilters && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button
                onClick={() => {
                  setSelectedGrade(null);
                  setShowGradeFilters(false);
                }}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === null ? "bg-blue-100" : ""}`}
              >
                All Grades
              </button>
              {["7", "8", "9", "10"].map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade);
                    setShowGradeFilters(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === grade ? "bg-blue-100" : ""}`}
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* [SECTION] Class Cards */}
      <div className="grid grid-cols-1 gap-6 bg-[var(--color-bg-100)] px-3 rounded-xl py-4 md:flex-row md:gap-4 items-stretch w-full">
        {!error && classes.length === 0 && (
          <EmptyState
            title="No sections found"
            subtitle="You currently have no assigned sections. Please contact admin if this is an error."
            iconSrc="/no-data-icon.svg"
          />
        )}

        {error && (
          <EmptyState
            title="Unable to Load Sections"
            subtitle="You don't have any assigned sections yet. If you think this is a mistake, please contact the administrator."
            iconSrc="/error-icon.svg"
          />
        )}

        {!loading && !error && filteredClasses.length === 0 && classes.length > 0 && (
          <EmptyState
            title="No classes match your filter"
            subtitle="Try adjusting the search term or grade filter."
            iconSrc="/no-data-icon.svg"
          />
        )}

        {!loading &&
          !error &&
          filteredClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              id={cls.id}
              name={cls.name}
              classSize={cls.classSize}
              color={cls.color}
              curriculum={cls.curriculum}
            />
          ))}
      </div>
    </div>
  );
};

export default AdviserClassManagement;