// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PageTitle from "../../components/PageTitle";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";

// ?[INTERFACES]
interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  curriculum: string;
}

// [INTERFACE] Adviser
interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  email: string;
}

const curriculumOptions = ["Regular", "STE", "SPS", "SPA", "SPJ"];
const gradeLevelOptions = ["7", "8", "9", "10"];

// [HELPER] Generate school year options (current + next 2)
const generateSchoolYearOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  return [-1, 0, 1].map(offset => `${currentYear + offset} - ${currentYear + offset + 1}`);
};

const AdminSections = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  // [STATES] Advisers
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [adviserSearch, setAdviserSearch] = useState("");
  const [showAdviserDropdown, setShowAdviserDropdown] = useState(false);
  const adviserDropdownRef = useRef<HTMLDivElement>(null);
  const schoolYearOptions = generateSchoolYearOptions();

  type FormData = Omit<Section, "id"> & {
    id?: number;
    gradeLevel: string;
    adviserId: string;
    adviserName: string;
    schoolYear: string;
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    gradeLevel: "7",
    curriculum: "Regular",
    adviserId: "",
    adviserName: "",
    schoolYear: schoolYearOptions[1],
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] Filters
  const [selectedCurriculum, setSelectedCurriculum] = useState<string | "All">("All");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | "All">("All");

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [STATE] Selected sections for bulk operations
  const [selectedSections, setSelectedSections] = useState<number[]>([]);

  // [STATE] Bulk operations
  const [bulkCurriculum, setBulkCurriculum] = useState<string>("");

  // [HANDLE] Close adviser dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adviserDropdownRef.current && !adviserDropdownRef.current.contains(e.target as Node)) {
        setShowAdviserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // [FETCH] Advisers
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to fetch advisers");
      setAdvisers(Array.isArray(data.data?.data) ? data.data.data : []);
    } catch (err) {
      console.error("Fetch advisers error:", err);
      setAdvisers([]);
    }
  };

  // [HANDLE] Bulk Update
  const handleBulkUpdate = async () => {
    if (selectedSections.length === 0 || !bulkCurriculum) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/section/bulk-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedSections, curriculum: bulkCurriculum }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Bulk update failed");
      setSections(prev => prev.map(s => selectedSections.includes(s.id) ? { ...s, curriculum: bulkCurriculum } : s));
      setSelectedSections([]);
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
    if (selectedSections.length === 0) return;
    setModalTitle(`Delete ${selectedSections.length} Selected Sections`);
    setIsCancelable(true);
    setShowModal(true);
    const onBulkDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: selectedSections }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Bulk delete failed");
        setSections(prev => prev.filter(s => !selectedSections.includes(s.id)));
        setSelectedSections([]);
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

  // *[HANDLE] Fetch Sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch sections");
      setSections(Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching sections");
      setIsCancelable(true);
      setShowModal(true);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // [HANDLE] Add section
  const handleAddSection = async () => {
    setFormData({
      name: "",
      gradeLevel: "7",
      curriculum: "Regular",
      adviserId: "",
      adviserName: "",
      schoolYear: schoolYearOptions[1],
    });
    setAdviserSearch("");
    setIsEditMode(false);
    setModalTitle("Create Section");
    setIsCancelable(true);
    setFormError("");
    await fetchAdvisers();
    setShowModal(true);
  };

  // [HANDLE] Open edit
  const handleOpenEdit = async (section: Section) => {
    setFormData({
      ...section,
      gradeLevel: String(section.gradeLevel),
      adviserId: "",
      adviserName: "",
      schoolYear: schoolYearOptions[1],
    });
    setAdviserSearch("");
    setIsEditMode(true);
    setModalTitle("Edit Section");
    setIsCancelable(true);
    setFormError("");
    await fetchAdvisers();
    setShowModal(true);
  };

  // [HANDLE] Submit form
  const handleSubmit = async () => {
    const name = (formData.name || "").trim();
    const gradeLevelNum = parseInt(formData.gradeLevel, 10);

    // [VALIDATION]
    if (!name) { setFormError("Section name is required"); return; }
    if (isNaN(gradeLevelNum) || gradeLevelNum < 7 || gradeLevelNum > 10) {
      setFormError("Grade level must be between 7 and 10"); return;
    }
    if (!isEditMode && (!formData.adviserId || !formData.adviserName)) {
      setFormError("Please select an adviser"); return;
    }
    if (!isEditMode && !formData.schoolYear) { setFormError("School year is required"); return; }

    const dataToSubmit = {
      name,
      gradeLevel: gradeLevelNum,
      curriculum: formData.curriculum,
      // Ensure adviserId and schoolYear are always included when creating
      ...(isEditMode ? {} : {
        ...(isEditMode ? {} : {
          adviserId: formData.adviserId,
          schoolYear: formData.schoolYear,
          isAdvisory: !!formData.adviserId,
        }),
      }),
    };

    console.log("Submitting section:", dataToSubmit); // ✅ Debug log

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        setSections(prev => prev.map(s => s.id === data.data.id ? data.data : s));
      } else {
        const created = data.data?.created;
        if (created && created.length > 0) {
          setSections(prev => [...prev, created[0]]);
        } else {
          const failMsg = data.data?.failed?.[0]?.message;
          setFormError(failMsg || "Section creation failed");
          return;
        }
      }

      setShowModal(false);
    } catch (err: any) {
      console.error("Section submit error:", err);
      setFormError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete section
  const handleDelete = (id: number) => {
    setModalTitle("Delete Section");
    setIsCancelable(true);
    setShowModal(true);
    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete section");
        setSections(prev => prev.filter(s => s.id !== id));
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

  // [COMPUTED] Filtered adviser list for search dropdown
  const filteredAdvisers = advisers.filter(a =>
    a.name.toLowerCase().includes(adviserSearch.toLowerCase()) ||
    a.adviserId.includes(adviserSearch)
  );

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // [HANDLE] Sorting and Searching
  const filteredSections = sections
    .filter(s =>
      s.name && s.name.toLowerCase().includes(search.toLowerCase()) &&
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

  // [PAGINATION]
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const displayedSections = filteredSections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS]
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Sections", path: null },
  ];

  const isFormModal = modalTitle === "Create Section" || modalTitle === "Edit Section";

  return (
    <div className="py-10 px-4 space-y-4 relative">
      {/* [COMPONENT] CRUD Modal */}
      <CrudModal<FormData>
        isOpen={showModal}
        title={modalTitle}
        isCancelable={isCancelable}
        onClose={() => setShowModal(false)}
        onConfirm={isEditMode || modalTitle.includes("Create") ? handleSubmit : onConfirmAction}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        showForm={isFormModal}
        formError={formError}
        formFields={[
          { key: "name", label: "Name", type: "text" },
          {
            key: "gradeLevel",
            label: "Grade Level",
            type: "select",
            options: gradeLevelOptions,
            value: formData.gradeLevel,
            onChange: (value) => setFormData(prev => ({ ...prev, gradeLevel: value }))
          },
          {
            key: "curriculum",
            label: "Curriculum",
            type: "select",
            options: curriculumOptions,
            value: formData.curriculum,
            onChange: (value) => setFormData(prev => ({ ...prev, curriculum: value }))
          },
          ...(!isEditMode ? [{
            key: "schoolYear" as keyof FormData,
            label: "School Year",
            type: "select" as const,
            options: schoolYearOptions,
            value: formData.schoolYear,
            onChange: (value: string) => setFormData(prev => ({ ...prev, schoolYear: value }))
          }] : []),
        ]}
        // Pass the adviser picker as a custom slot below the generated fields
        extraContent={
          !isEditMode ? (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--color-text-800)]">Adviser</label>
              <div ref={adviserDropdownRef} className="relative">
                <input
                  type="text"
                  placeholder="Search adviser by name or ID..."
                  value={adviserSearch}
                  onFocus={() => setShowAdviserDropdown(true)}
                  onChange={(e) => {
                    setAdviserSearch(e.target.value);
                    setFormData(prev => ({ ...prev, adviserId: "", adviserName: "" }));
                    setShowAdviserDropdown(true);
                  }}
                  className="w-full bg-[var(--color-bg-50)] font-roboto rounded-sm py-2 px-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
                />
                {formData.adviserName && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-primary-600)] font-medium pointer-events-none">
                    ✓ {formData.adviserName}
                  </span>
                )}
                {showAdviserDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredAdvisers.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">No advisers found</p>
                    ) : (
                      filteredAdvisers.map(adviser => (
                        <button
                          key={adviser.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, adviserId: adviser.adviserId, adviserName: adviser.name }));
                            setAdviserSearch(adviser.name);
                            setShowAdviserDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-100)] transition-colors ${
                            formData.adviserId === adviser.adviserId ? "bg-blue-50 text-[var(--color-primary-700)]" : "text-[var(--color-text-900)]"
                          }`}
                        >
                          <span className="font-medium">{adviser.name}</span>
                          <span className="ml-2 text-xs text-gray-400">#{adviser.adviserId}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null
        }
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
      <PageTitle title="Sections" />

      {/* [SECTION] Search & Filters */}
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
              showSortFilters ? "bg-[var(--color-primary-600)]" : "bg-[var(--color-primary-700)] hover:opacity-80"
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

      {/* [SECTION] Add Section */}
      <div className="mt-2 space-y-2">
        <PrimaryButton text="Add Section" iconSrc="/add-icon.svg" onClick={handleAddSection} />
      </div>

      {/* [SECTION] Sections Table */}
      <div className="overflow-x-auto mt-4 rounded-lg">
        {displayedSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-center text-[var(--color-text-800)]">
            <img src="/no-data-icon.svg" alt="No sections" className="size-16" />
            <p className="font-roboto font-semibold text-lg">No sections found</p>
            <p className="font-roboto text-sm text-[var(--color-text-700)]">Try searching for a different section name.</p>
          </div>
        ) : (
          <table className="overflow-hidden rounded-lg min-w-full bg-white shadow-md table-auto border-collapse">
            <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
              <tr>
                <th className="py-2 px-4 pr-2 text-center">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSections(filteredSections.map(s => s.id));
                      else setSelectedSections([]);
                    }}
                    checked={selectedSections.length === filteredSections.length && filteredSections.length > 0}
                  />
                </th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] truncate max-w-[180px]">Name</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--color-primary-600)] w-16">Grade</th>
                <th className="py-2 px-4 text-left hidden md:table-cell font-bold border-r border-[var(--color-primary-600)]">Curriculum</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="font-roboto">
              {displayedSections.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-bg-100)] transition-colors">
                  <td className="text-center py-2 px-4 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSections(prev => [...prev, s.id]);
                        else setSelectedSections(prev => prev.filter(id => id !== s.id));
                      }}
                    />
                  </td>
                  <td className="text-md font-bold py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] truncate whitespace-nowrap max-w-[110px]">{s.name}</td>
                  <td className="text-sm text-center py-2 px-2 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] w-16">{s.gradeLevel}</td>
                  <td className="text-sm text-center py-2 px-4 text-[var(--color-text-900)] hidden md:table-cell border-r border-[var(--color-bg-300)]">{s.curriculum}</td>
                  <td className="py-2 px-4 flex gap-4">
                    <button className="text-[var(--color-primary-500)] text-sm font-medium cursor-pointer hover:underline" onClick={() => handleOpenEdit(s)}>Edit</button>
                    <button className="text-[var(--color-red-500)] text-sm font-medium cursor-pointer hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* [SECTION] Pagination */}
      {displayedSections.length !== 0 && (
        <div className="flex justify-between items-center space-x-4 mt-4">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
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
              page === totalPages ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSections;