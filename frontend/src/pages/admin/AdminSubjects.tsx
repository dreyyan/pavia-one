// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import DashboardSkeleton from "../../components/DashboardSkeleton";
import PageTitle from "../../components/PageTitle";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";

// ?[INTERFACES]
interface Subject {
  id: number;
  name: string;
  gradeLevel: number;
  curriculum: string;
  writtenWorkWeight: number;
  performanceTaskWeight: number;
  quarterlyAssessmentWeight: number;
}

interface SubjectResponse {
  id: number;
  name: string;
  gradeLevel: number;
  curriculum: string;
  writtenWorkWeight: number;
  performanceTaskWeight: number;
  quarterlyAssessmentWeight: number;
}

const curriculumOptions = ["Regular", "STE", "SPS", "SPA", "SPJ"];

const AdminSubjects = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  type FormData = Omit<Subject, 'id' | 'writtenWorkWeight' | 'performanceTaskWeight' | 'quarterlyAssessmentWeight' | 'gradeLevel'> & {
    id?: number;
    gradeLevel: string;
    writtenWorkWeight: string;
    performanceTaskWeight: string;
    quarterlyAssessmentWeight: string;
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    gradeLevel: "7",
    curriculum: "Regular",
    writtenWorkWeight: "0.3",
    performanceTaskWeight: "0.5",
    quarterlyAssessmentWeight: "0.2",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] Filters
  const [selectedCurriculum, setSelectedCurriculum] = useState<string | "All">("All");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | "All">("All");

  const gradeLevelOptions = ["7", "8", "9", "10"];

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [STATE] Selected subjects for bulk operations
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  // [STATE] Bulk operations
  const [bulkCurriculum, setBulkCurriculum] = useState<string>("");

  // [HANDLE] Bulk Update
  const handleBulkUpdate = async () => {
    if (selectedSubjects.length === 0 || !bulkCurriculum) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/bulk-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ids: selectedSubjects,
            curriculum: bulkCurriculum,
          }),
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Bulk update failed");

      // Update local state
      setSubjects((prev) =>
        prev.map((s) =>
          selectedSubjects.includes(s.id)
            ? { ...s, curriculum: bulkCurriculum }
            : s
        )
      );

      setSelectedSubjects([]);
      setBulkCurriculum("");
    } catch (err) {
      console.error("Bulk update error:", err);
      setModalTitle("Bulk Update Failed");
      setIsCancelable(true);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedSubjects.length === 0) return;

    setModalTitle(`Delete ${selectedSubjects.length} Selected Subjects`);
    setIsCancelable(true);
    setShowModal(true);

    const onBulkDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/bulk-delete`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ids: selectedSubjects }),
          }
        );

        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Bulk delete failed");

        // Remove deleted subjects from local state
        setSubjects((prev) => prev.filter((s) => !selectedSubjects.includes(s.id)));
        setSelectedSubjects([]);
      } catch (err) {
        console.error("Bulk delete error:", err);
        setModalTitle("Bulk Delete Failed");
        setIsCancelable(true);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onBulkDeleteConfirm);
  };

  // *[HANDLE] Fetch Subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch subjects");

      // convert weights to string for editing
      const subjectsWithStrings = data.data.map((s: SubjectResponse) => ({
        ...s,
        writtenWorkWeight: String(s.writtenWorkWeight),
        performanceTaskWeight: String(s.performanceTaskWeight),
        quarterlyAssessmentWeight: String(s.quarterlyAssessmentWeight),
      }));

      setSubjects(subjectsWithStrings);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching subjects");
      setIsCancelable(true);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // [HANDLE] Add subject
  const handleAddSubject = () => {
    setFormData({
      name: "",
      gradeLevel: "7",
      curriculum: "Regular",
      writtenWorkWeight: "0.3",
      performanceTaskWeight: "0.5",
      quarterlyAssessmentWeight: "0.2",
    });
    setIsEditMode(false);
    setModalTitle("Create Subject");
    setIsCancelable(true);
    setFormError("");
    setShowModal(true);
  };

  // [HANDLE] Open edit
  const handleOpenEdit = (subject: Subject) => {
    setFormData({
      ...subject,
      name: subject.name ?? "",
      gradeLevel: String(subject.gradeLevel),
      writtenWorkWeight: String(subject.writtenWorkWeight),
      performanceTaskWeight: String(subject.performanceTaskWeight),
      quarterlyAssessmentWeight: String(subject.quarterlyAssessmentWeight),
    });
    setIsEditMode(true);
    setModalTitle("Edit Subject");
    setIsCancelable(true);
    setFormError("");
    setShowModal(true);
  };

  // [HANDLE] Submit form
  const handleSubmit = async () => {
    const name = (formData.name || "").trim();

    if (!name) {
      setFormError("Subject name is required");
      return;
    }

    const gradeLevelNum = parseInt(formData.gradeLevel, 10);
    if (isNaN(gradeLevelNum) || gradeLevelNum < 7 || gradeLevelNum > 10) {
      setFormError("Grade level must be a valid number between 7 and 10");
      return;
    }

    const ww = parseFloat(formData.writtenWorkWeight!);
    const pt = parseFloat(formData.performanceTaskWeight!);
    const qa = parseFloat(formData.quarterlyAssessmentWeight!);

    if ([ww, pt, qa].some(w => isNaN(w) || w < 0 || w > 1)) {
      setFormError("Each weight must be between 0 and 1");
      return;
    }

    if (Math.abs(Number((ww + pt + qa).toFixed(3)) - 1) > 0.001) {
      setFormError("Weights must sum up to 1");
      return;
    }

    const dataToSubmit = {
      ...formData,
      name,
      gradeLevel: gradeLevelNum,
      writtenWorkWeight: ww,
      performanceTaskWeight: pt,
      quarterlyAssessmentWeight: qa,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        setSubjects(prev =>
          prev.map(s =>
            s.id === data.data.id
              ? {
                  ...data.data,
                  writtenWorkWeight: String(data.data.writtenWorkWeight),
                  performanceTaskWeight: String(data.data.performanceTaskWeight),
                  quarterlyAssessmentWeight: String(data.data.quarterlyAssessmentWeight),
                }
              : s
          )
        );
      } else {
        setSubjects(prev => [
          ...prev,
          {
            ...data.data[0] || data.data,
            writtenWorkWeight: String(data.data[0]?.writtenWorkWeight || 0),
            performanceTaskWeight: String(data.data[0]?.performanceTaskWeight || 0),
            quarterlyAssessmentWeight: String(data.data[0]?.quarterlyAssessmentWeight || 0),
          },
        ]);
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      setFormError("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete subject
  const handleDelete = (id: number) => {
    setModalTitle("Delete Subject");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete subject");
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        console.error("Delete error:", err);
        setModalTitle("Delete Failed");
        setIsCancelable(true);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onDeleteConfirm);
  };

  // [LOADING STATE]
  if (loading) return <DashboardSkeleton />;

  // [HANDLE] Sorting and Searching
  const filteredSubjects = subjects
    .filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCurriculum === "All" || s.curriculum === selectedCurriculum) &&
      (selectedGradeLevel === "All" || String(s.gradeLevel) === selectedGradeLevel)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "grade-asc": return a.gradeLevel - b.gradeLevel;
        case "grade-desc": return b.gradeLevel - a.gradeLevel;
        default: return 0;
      }
    });

  // [PAGINATION CALCULATIONS]
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const displayedSubjects = filteredSubjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // [HANDLE] Pagination
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Subjects", path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-4 relative">
      {/* [COMPONENT] CRUD Modal */}
      <CrudModal
        isOpen={showModal}
        title={modalTitle}
        isCancelable={isCancelable}
        onClose={() => setShowModal(false)}
        onConfirm={isEditMode || modalTitle.includes("Create") ? handleSubmit : onConfirmAction}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        showForm={modalTitle === "Create Subject" || modalTitle === "Edit Subject"}
        formError={formError}
        formFields={[
          { key: "name", label: "Name", type: "text" },
          { key: "gradeLevel",
            label: "Grade Level",
            type: "select",
            options: gradeLevelOptions,
            value: formData.gradeLevel,
            onChange: (value) => setFormData(prev => ({ ...prev, gradeLevel: value }))
          },
          { key: "curriculum", label: "Curriculum", type: "select", options: curriculumOptions },
          { key: "writtenWorkWeight", label: "Written Work Weight", type: "text", value: formData.writtenWorkWeight, onChange: (value) => setFormData(prev => ({ ...prev, writtenWorkWeight: value })) },
          { key: "performanceTaskWeight", label: "Performance Task Weight", type: "text", value: formData.performanceTaskWeight, onChange: (value) => setFormData(prev => ({ ...prev, performanceTaskWeight: value })) },
          { key: "quarterlyAssessmentWeight", label: "Quarterly Assessment Weight", type: "text", value: formData.quarterlyAssessmentWeight, onChange: (value) => setFormData(prev => ({ ...prev, quarterlyAssessmentWeight: value })) },
        ]}
      />

      {/* [BREADCRUMBS] */}
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx}>
            {crumb.path ? (
              <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>{crumb.label}</span>
            ) : (
              <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
            )}
            {idx < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      {/* [UI] Page Title */}
      <PageTitle title="Subjects" />

      {/* [SECTION] Search & Sort */}
      <div className="flex md:flex-row gap-2 md:gap-4 items-start md:items-center w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-bg-50)] font-roboto rounded-sm py-2 pl-4 pr-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
          />
        </div>
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm p-2 transition cursor-pointer ${
              showSortFilters ? "bg-[var(--color-primary-600)] border-[var(--color-primary-500)]" : "bg-[var(--color-primary-700)] border-[var(--color-primary-700)] hover:opacity-80"
            }`}
          >
            <img src="/filter-icon.svg" alt="Sort" className="w-5 h-5" />
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
      </div>

      <div className="flex md:flex-row gap-2 md:gap-4 md:items-center w-full">
        {/* Curriculum Filter */}
        <select
          value={selectedCurriculum}
          onChange={(e) => setSelectedCurriculum(e.target.value)}
          className="flex-1 bg-[var(--color-bg-50)] text-sm font-roboto rounded-sm py-2 px-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
        >
          <option value="All">All Curriculums</option>
          {curriculumOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Grade Level Filter */}
        <select
          value={selectedGradeLevel}
          onChange={(e) => setSelectedGradeLevel(e.target.value)}
          className="bg-[var(--color-bg-50)] text-sm font-roboto rounded-sm py-2 px-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
        >
          <option value="All">All Grades</option>
          {gradeLevelOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* [SECTOIN] Add Subject & Auto Create Learning Areas */}
      <div className="mt-2 space-y-2">
        <PrimaryButton text="Add Subject" iconSrc="/add-icon.svg" onClick={handleAddSubject} />

      {/* [PRIMARY BUTTON] Auto-create All Subjects */}
      <PrimaryButton
        text="Auto-create All Subjects"
        color="FCB103"
        onClick={async () => {
          setLoading(true);
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/auto-create-all`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            // Add new subjects from backend
            setSubjects(prev => [
              ...prev,
              ...data.data.map((s: SubjectResponse) => ({
                ...s,
                writtenWorkWeight: String(s.writtenWorkWeight),
                performanceTaskWeight: String(s.performanceTaskWeight),
                quarterlyAssessmentWeight: String(s.quarterlyAssessmentWeight),
              })),
            ]);
          } catch (err) {
            console.error(err);
            setModalTitle("Failed to auto-create subjects");
            setIsCancelable(true);
            setShowModal(true);
          } finally {
            setLoading(false);
          }
        }}
      />
      </div>

      {/* [SECTION] Subjects Table */}
      <div className="overflow-x-auto mt-4 rounded-lg">
        {displayedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-center text-[var(--color-text-800)]">
            <img src="/no-data-icon.svg" alt="No subjects" className="size-16" />
            <p className="font-roboto font-semibold text-lg">No subjects found</p>
            <p className="font-roboto text-sm text-[var(--color-text-700)]">Try searching for a different subject name.</p>
          </div>
        ) : (
          <div className="">
            {/* [DROPDOWN] Bulk Change Curriculum */}
            <select
              value={bulkCurriculum}
              onChange={(e) => setBulkCurriculum(e.target.value)}
              className="flex-1 w-full bg-[var(--color-bg-50)] text-sm font-roboto py-2 px-3 outline-none focus:ring-0"
            >
              <option value="">Change Curriculum...</option>
              {curriculumOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Bulk update inputs */}
            <div className="flex flex-col bg-[var(--color-bg-50)] p-2 gap-2 items-center mb-2 rounded-md">
              <PrimaryButton
                text={`Apply to Selected (${selectedSubjects.length})`}
                onClick={handleBulkUpdate}
                disabled={selectedSubjects.length === 0 || !bulkCurriculum}
              />
              <PrimaryButton
                text={`Delete Selected (${selectedSubjects.length})`}
                onClick={handleBulkDelete}
                disabled={selectedSubjects.length === 0}
                iconSrc="/delete-icon.svg"
              />
            </div>

            <table className="overflow-hidden rounded-lg min-w-full bg-white shadow-md table-auto border-collapse">
              <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
                <tr className="">
                  <th className="py-2 px-4 pr-2 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSubjects(filteredSubjects.map(s => s.id));
                        else setSelectedSubjects([]);
                      }}
                      checked={selectedSubjects.length === filteredSubjects.length && filteredSubjects.length > 0}
                    />
                  </th>
                  <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] truncate max-w-[180px]">
                    Name
                  </th>
                  <th className="py-2 px-2 text-center font-bold border-r border-[var(--color-primary-600)] w-16">
                    Grade
                  </th>
                  <th className="py-2 px-4 text-left hidden md:table-cell font-bold border-r border-[var(--color-primary-600)]">Curriculum</th>
                  <th className="py-2 px-4 text-left hidden md:table-cell border-r border-[var(--color-primary-600)]">WW</th>
                  <th className="py-2 px-4 text-left hidden md:table-cell border-r border-[var(--color-primary-600)]">PT</th>
                  <th className="py-2 px-4 text-left hidden md:table-cell">QA</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="font-roboto">
                {displayedSubjects.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--color-bg-100)] transition-colors">
                    <td className="text-center py-2 px-4 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSubjects(prev => [...prev, s.id]);
                          else setSelectedSubjects(prev => prev.filter(id => id !== s.id));
                        }}
                      />
                    </td>

                    <td className="text-md font-bold py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] truncate whitespace-nowrap max-w-[110px]">
                      {s.name}
                    </td>

                    <td className="text-sm text-center py-2 px-2 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] w-16">
                      {s.gradeLevel}
                    </td>

                    <td className="text-sm text-center py-2 px-4 text-[var(--color-text-900)] hidden md:table-cell border-r border-[var(--color-bg-300)]">
                      {s.curriculum}
                    </td>
                    <td className="py-2 px-4 text-[var(--color-text-900)] hidden md:table-cell border-r border-[var(--color-bg-300)]">{s.writtenWorkWeight}</td>
                    <td className="py-2 px-4 text-[var(--color-text-900)] hidden md:table-cell border-r border-[var(--color-bg-300)]">{s.performanceTaskWeight}</td>
                    <td className="py-2 px-4 text-[var(--color-text-900)] hidden md:table-cell">{s.quarterlyAssessmentWeight}</td>
                    <td className="py-2 px-4 flex gap-4">
                      <button className="text-[var(--color-primary-500)] text-sm font-medium cursor-pointer hover:underline" onClick={() => handleOpenEdit(s)}>Edit</button>
                      <button className="text-[var(--color-red-500)] text-sm font-medium cursor-pointer hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* [SECTION] Pagination */}
      {displayedSubjects.length !== 0 && (
        <div className="flex justify-between items-center space-x-4 mt-4">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === 1
                ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
                : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            &lt; Previous
          </button>

          <span className="flex gap-x-1 text-sm text-[var(--color-text-900)] font-medium">
            Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
          </span>

          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === totalPages
                ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
                : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSubjects;