/* eslint-disable @typescript-eslint/no-explicit-any */

// [IMPORT] React
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Helpers, Constants, Types
import { STATUS_BADGE, STATUS_LABEL } from "../../constants";
import { SchoolFormStatus } from "../../types";

interface SectionForm {
  id: number;
  type: string;
  status: SchoolFormStatus;
  schoolYear: string;
}

interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  color: string;
  classSize: number;
  schoolForms: SectionForm[];
}

// [HELPER] Form badge
function FormBadge({ type, form }: { type: string; form?: SectionForm }) {
  if (!form) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-50 text-gray-400 border border-dashed border-gray-300">
        {type}: —
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[form.status]}`}>
      {type}: {STATUS_LABEL[form.status]}
    </span>
  );
}

const AdviserSchoolForms = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // [STATES] Search, Sort, Filters
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [selectedGrade, setSelectedGrade] = useState("All");

  const [showSortFilters, setShowSortFilters] = useState(false);
  const [showGradeFilters, setShowGradeFilters] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // * [EFFECT] Fetch adviser's sections with their school forms
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
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
            id:         s.id,
            name:       s.name,
            gradeLevel: s.gradeLevel,
            schoolYear: s.schoolYear,
            color:      s.color || "#6366f1",
            classSize:  s.classSize || 0,
            schoolForms: s.schoolForms || [],
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [setShowTokenExpiredModal]);

  // * [EFFECT] Filters dropdown
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowSortFilters(false);
        setShowGradeFilters(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // [FILTER]
  const filtered = sections
    .filter((s) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.schoolYear.toLowerCase().includes(q);

      const matchGrade =
        selectedGrade === "All" || String(s.gradeLevel) === selectedGrade;

      return matchSearch && matchGrade;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "grade-asc":
          return a.gradeLevel - b.gradeLevel;
        case "grade-desc":
          return b.gradeLevel - a.gradeLevel;
        default:
          return 0;
      }
    });

  return (
    <div className="py-10 px-4 space-y-4">
      {/* [COMPONENT] Header */}
      <div>
        <h2 className="text-[var(--color-text-800)]">School Forms</h2>
        <p className="text-sm text-[var(--color-text-500)] font-roboto mt-0.5">
          View and manage school forms for your advisory class.
        </p>
      </div>

      {/* [SECTION] Search & Filters */}
      <div className="bg-[var(--color-bg-100)] px-3 rounded-lg py-4 flex md:flex-row gap-2 md:gap-4 items-stretch w-full">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name or school year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
          />
        </div>

        {/* Sort */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className="flex items-center justify-center rounded-sm px-3 h-10 bg-[var(--color-bg-50)] hover:opacity-80"
          >
            <img src="/sort.svg" alt="Sort" className="size-4" />
          </button>

          {showSortFilters && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}>Name ↑</button>
              <button onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}>Name ↓</button>
              <button onClick={() => { setSortOption("grade-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "grade-asc" ? "bg-blue-100" : ""}`}>Grade ↑</button>
              <button onClick={() => { setSortOption("grade-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "grade-desc" ? "bg-blue-100" : ""}`}>Grade ↓</button>
            </div>
          )}
        </div>

        {/* Grade Filter */}
        <div className="relative">
          <button
            onClick={() => setShowGradeFilters(!showGradeFilters)}
            className="flex items-center justify-center rounded-sm px-3 h-10 bg-[var(--color-bg-50)] hover:opacity-80"
          >
            <img src="/filter.svg" alt="Filter" className="size-4" />
          </button>

          {showGradeFilters && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button onClick={() => { setSelectedGrade("All"); setShowGradeFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === "All" ? "bg-blue-100" : ""}`}>All</button>
              {["7","8","9","10"].map((g) => (
                <button
                  key={g}
                  onClick={() => { setSelectedGrade(g); setShowGradeFilters(false); }}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === g ? "bg-blue-100" : ""}`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--color-bg-100)] rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <EmptyState
          title="Unable to Load Sections"
          subtitle="Could not fetch your sections. Please check your connection and try again."
        />
      )}

      {!loading && !error && sections.length === 0 && (
        <EmptyState
          title="No Sections Assigned"
          subtitle="You have no advisory sections. Contact the administrator if this is an error."
        />
      )}

      {!loading && !error && sections.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="No Sections Match"
          subtitle="Try a different search term or clear the grade filter."
        />
      )}

      {/* Section Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((section) => {
            const sf1 = section.schoolForms.find((f) => f.type === "SF1");
            const sf5 = section.schoolForms.find((f) => f.type === "SF5");

            return (
              <div
                key={section.id}
                onClick={() => navigate(`/adviser/school-forms/${section.id}`)}
                className="bg-white rounded-lg border border-[var(--color-bg-200)] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                {/* Card accent bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: section.color }}
                />

                {/* Card header */}
                <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[var(--color-bg-100)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: section.color }}
                    >
                      G{section.gradeLevel}
                    </div>
                    <div className="min-w-0">
                      <p className="font-roboto font-bold text-[var(--color-text-900)] leading-tight truncate">
                        {section.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-500)] mt-0.5">
                        {section.schoolYear} · {section.classSize} student{section.classSize !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <img src="/chevron-right.svg" alt="" className="size-4 text-[var(--color-text-400)] flex-shrink-0" />
                </div>

                {/* Form status badges */}
                <div className="px-4 py-3 flex flex-wrap gap-2">
                  <FormBadge type="SF1" form={sf1} />
                  <FormBadge type="SF5" form={sf5} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdviserSchoolForms;