/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/useAuth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FormStatus = "DRAFT" | "GENERATED" | "SUBMITTED" | "APPROVED" | "LOCKED";

interface SectionForm {
  id: number;
  type: string;
  status: FormStatus;
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<FormStatus, string> = {
  DRAFT:     "bg-gray-100 text-gray-500 border border-gray-200",
  GENERATED: "bg-blue-100 text-blue-700 border border-blue-200",
  SUBMITTED: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  APPROVED:  "bg-green-100 text-green-700 border border-green-200",
  LOCKED:    "bg-purple-100 text-purple-700 border border-purple-200",
};

const STATUS_LABEL: Record<FormStatus, string> = {
  DRAFT:     "Draft",
  GENERATED: "Generated",
  SUBMITTED: "Submitted",
  APPROVED:  "Approved",
  LOCKED:    "Locked",
};

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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const AdviserSchoolForms = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [search, setSearch]               = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [showFilters, setShowFilters]     = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilters(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Fetch adviser's sections with their school forms
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

  const filtered = sections
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.schoolYear.includes(q);
      const matchGrade = !selectedGrade || String(s.gradeLevel) === selectedGrade;
      return matchSearch && matchGrade;
    });

  return (
    <div className="py-10 px-4 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[var(--color-text-800)]">School Forms</h2>
        <p className="text-sm text-[var(--color-text-500)] font-roboto mt-0.5">
          View and manage school forms for your advisory class.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by section name or school year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-bg-50)] font-roboto rounded-sm py-2 px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
          />
        </div>
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center rounded-sm p-2.5 border transition cursor-pointer ${
              selectedGrade
                ? "bg-[var(--color-primary-600)] border-[var(--color-primary-700)] text-white"
                : "bg-[var(--color-bg-50)] border-[var(--color-text-300)] hover:bg-[var(--color-bg-200)]"
            }`}
          >
            <img src="/filter-icon.svg" alt="Filter" className="w-4 h-4" />
          </button>
          {showFilters && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-1 z-50">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-500)] px-2 pt-1 pb-0.5">
                Grade Level
              </p>
              <button
                onClick={() => { setSelectedGrade(null); setShowFilters(false); }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${!selectedGrade ? "bg-blue-50 text-blue-700 font-semibold" : ""}`}
              >All Grades</button>
              {["7", "8", "9", "10"].map((g) => (
                <button
                  key={g}
                  onClick={() => { setSelectedGrade(g); setShowFilters(false); }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${selectedGrade === g ? "bg-blue-50 text-blue-700 font-semibold" : ""}`}
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
          iconSrc="/error-icon.svg"
        />
      )}

      {!loading && !error && sections.length === 0 && (
        <EmptyState
          title="No Sections Assigned"
          subtitle="You have no advisory sections. Contact the administrator if this is an error."
          iconSrc="/no-data-icon.svg"
        />
      )}

      {!loading && !error && sections.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="No Sections Match"
          subtitle="Try a different search term or clear the grade filter."
          iconSrc="/no-data-icon.svg"
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