/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Dropdown from "../../components/toolbar/Dropdown";
import SearchBar from "../../components/toolbar/SearchBar";
import Pagination from "../../components/toolbar/Pagination";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import StudentCard from "../../components/cards/student/StudentCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import StudentFormModal from "../../components/forms/StudentFormModal";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Helpers, Constants & Types
import { getVisiblePages, getLastName } from "../../helpers/index";
import { GRADE_LEVEL_OPTIONS, CURRICULUM_OPTIONS } from "../../constants";
import { GeneralModalConfig, StudentFormData, Adviser, Student } from "../../types";

const AdminStudents = () => {
  const navigate = useNavigate();

  // [STATES] Entities
  const [students, setStudents] = useState<Student[]>([]);
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [adviserSearch, setAdviserSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "filter" | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  type SortOption = "name-asc" | "name-desc" | "lrn-asc" | "lrn-desc";
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  // [STATES] Student Form Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<StudentFormData>({
    lrn: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nameExtension: "",
    email: "",
    sex: "MALE",
    birthDate: "",
    createdByAdviserId: "",
    adviserName: "",
    advisorySection: null,
    learningModality: "Face to Face",
  });

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: true,
    onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal({
      ...generalModal,
      isOpen: true,
      ...config,
    });
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // [EFFECT] Update items per page based on screen width (responsive design)
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;

      if (width < 768) setItemsPerPage(5);        // xs (cards)
      else if (width < 1024) setItemsPerPage(8);  // md (cards)
      else if (width < 1280) setItemsPerPage(10);  // lg (table)
      else if (width < 1536) setItemsPerPage(12); // xl (table)
      else setItemsPerPage(12);                   // 2xl (table)
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // [STATE] Selected Students (for bulk actions)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // * [HANDLE] Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students?page=${page}&limit=${itemsPerPage}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch students");

      const list = data.data?.data;
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      // ! [ERROR] Fetching student failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Student",
        message: "We couldn't load the student at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // [EFFECT] Reload page when screen size changes
  useEffect(() => {
    fetchStudents();
  }, [page, itemsPerPage, search]);

  // * [HANDLE] Fetch Advisers for Dropdown (w/ optional search) 
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to fetch advisers");
      setAdvisers(Array.isArray(data.data?.data) ? data.data.data : []);
    } catch (err) {
      // ! [ERROR] Fetching advisers failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Advisers",
        message: "We couldn't load the advisers at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setAdvisers([]);
    }
  };

  // * [HANDLE] Add Student
  const handleAddStudent = async () => {
    setFormData({
      lrn: "",
      firstName: "",
      middleName: "",
      lastName: "",
      nameExtension: "",
      email: "",
      sex: "MALE",
      birthDate: "",
      createdByAdviserId: "",
      adviserName: "",
      advisorySection: null,
      learningModality: "Face to Face",
    });
    setAdviserSearch("");
    setIsEditMode(false);
    setFormError("");
    await fetchAdvisers();
    setShowStudentModal(true);
  };

  // * [HANDLE] Bulk Delete Selected Students
  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) return;

    // ? [CONFIRMATION MODAL] Before bulk deletion
    openGeneralModal({
      title: "Delete Students",
      message: `Are you sure you want to delete ${selectedStudents.length} selected student(s)? This action cannot be undone.`,
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ ids: selectedStudents }),
          });

          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Bulk delete failed");

          setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
          setSelectedStudents([]);

          // * [SUCCESS] Students Deleted
          openGeneralModal({
            title: "Students Deleted",
            message: `${selectedStudents.length} student(s) have been deleted successfully.`,
            type: "success",
            confirmText: "OK",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } catch (err) {
          // ! [ERROR] Bulk Delete Failed
          console.error("Bulk delete error:", err);
          openGeneralModal({
            title: "Unable to Delete Students",
            message: "We couldn't delete the selected students at the moment. Please check your internet connection and try again.",
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // * [HANDLE] Submit Create/Edit Form
  const handleSubmit = async () => {
    const adviserId = formData.createdByAdviserId?.trim();

    // ! [ERROR] Adviser not selected
    if (!adviserId) {
      setFormError("Please select an adviser.");
      setLoading(false);
      return;
    }

    const dataToSubmit = isEditMode
      ? {
          id: formData.id,
          lrn: formData.lrn.trim(),
          firstName: formData.firstName.trim(),
          middleName: formData.middleName || null,
          lastName: formData.lastName.trim(),
          nameExtension: formData.nameExtension || null,
          email: formData.email || null,
          sex: formData.sex,
          birthDate: formData.birthDate || null,
          learningModality: formData.learningModality,
        }
      : {
          lrn: formData.lrn.trim(),
          firstName: formData.firstName.trim(),
          middleName: formData.middleName || null,
          lastName: formData.lastName.trim(),
          nameExtension: formData.nameExtension || null,
          email: formData.email || null,
          sex: formData.sex,
          birthDate: formData.birthDate || null,
          createdByAdviserId: adviserId,
          learningModality: formData.learningModality,
          ...(formData.advisorySection ? { sectionId: formData.advisorySection.id } : {}),
        };

    setLoading(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        method,
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(isEditMode ? [dataToSubmit] : dataToSubmit),
      });

      const data = await res.json();

      // Handle backend validation / business errors
      if (!data.success) {
        const errorMsg = data.message 
          || data.data?.failed?.[0]?.message 
          || "Operation failed";
        
        throw new Error(errorMsg);
      }

      // Success path
      if (isEditMode) {
        const updated = data.data?.updated;
        if (updated && updated.length > 0) {
          await fetchStudents();
        }
      } else {
        const created = data.data?.created;
        if (created && created.length > 0) {
          setStudents(prev => [...prev, created[0]]);
        }
      }

      // Close modal on success
      setShowStudentModal(false);
      
      // * [SUCCESS] Student Updated/Created
      openGeneralModal({
        title: isEditMode ? "Student Updated" : "Student Created",
        message: isEditMode 
          ? "The student has been updated successfully." 
          : "The student has been added successfully.",
        type: "success",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });

    } catch (err: any) {
      // ! [ERROR] Update/Create Student Failed
      console.error("Submit error:", err);
      const errorMessage = err.message || "An unexpected error occurred while saving the student.";
      setFormError(errorMessage);

      openGeneralModal({
        title: "Save Failed",
        message: errorMessage,
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Sorting & Searching
  const filteredStudents = students
    .filter(s =>
      (
        (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase())) ||
        (s.lrn && s.lrn.includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
      ) &&
      (selectedGrades.length === 0 || (s.enrollments?.[0]?.section?.gradeLevel != null && selectedGrades.includes(String(s.enrollments[0].section.gradeLevel)))) &&
      (selectedCurricula.length === 0 || (s.enrollments?.[0]?.section?.curriculum != null && selectedCurricula.includes(s.enrollments[0].section.curriculum))) &&
      (selectedSections.length === 0 || (s.enrollments?.[0]?.section?.name != null && selectedSections.includes(s.enrollments[0].section.name)))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return getLastName(a.fullName || "").localeCompare(getLastName(b.fullName || ""));
        case "name-desc":
          return getLastName(b.fullName || "").localeCompare(getLastName(a.fullName || ""));
        case "lrn-asc":
          return a.lrn.localeCompare(b.lrn);
        case "lrn-desc":
          return b.lrn.localeCompare(a.lrn);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const displayedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // * [BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Students", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  return (
    <>
      {/* [MODAL] General */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
        isCancelable={generalModal.isCancelable}
      />

      {/* [MODAL] Student Form */}
      <StudentFormModal
        isOpen={showStudentModal}
        title={isEditMode ? "Edit Student" : "Create Student"}
        onClose={() => setShowStudentModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        advisers={advisers}
        adviserSearch={adviserSearch}
        setAdviserSearch={setAdviserSearch}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
        isEditMode={isEditMode}
      />

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Students" />
        }
        toolbar={
          <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 md:gap-4 w-full">
                {/* [COMPONENT] Search Bar */}
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={search}
                    placeholder="Search by name, LRN, or email"
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
                      setSortOption(value as SortOption);
                      setPage(1);
                    }}
                    options={[
                      { label: "Name (A → Z)", value: "name-asc" },
                      { label: "Name (Z → A)", value: "name-desc" },
                      { label: "LRN ↑", value: "lrn-asc" },
                      { label: "LRN ↓", value: "lrn-desc" },
                    ]}
                  />

                  {/* [COMPONENT] Filter Dropdown */}
                  <Dropdown
                    icon="/filter.svg"
                    label="Filter"
                    isOpen={activeDropdown === "filter"}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === "filter" ? null : "filter")
                    }
                    width="w-56"
                    groups={[
                      {
                        label: "Grade",
                        options: GRADE_LEVEL_OPTIONS.map(g => ({ label: `Grade ${g}`, value: String(g) })),
                        selectedValues: selectedGrades,
                        onSelectMultiple: (v) => { setSelectedGrades(v); setPage(1); },
                      },
                      {
                        label: "Curriculum",
                        options: CURRICULUM_OPTIONS.map(c => ({ label: c.label, value: c.value })),
                        selectedValues: selectedCurricula,
                        onSelectMultiple: (v) => { setSelectedCurricula(v); setPage(1); },
                      },
                      {
                        label: "Section",
                        options: [...new Map(
                          students
                            .flatMap(s => s.enrollments ?? [])
                            .filter(e => e.section?.name)
                            .map(e => [e.section!.name, { label: e.section!.name, value: e.section!.name }])
                        ).values()].sort((a, b) => a.label.localeCompare(b.label)),
                        selectedValues: selectedSections,
                        onSelectMultiple: (v) => { setSelectedSections(v); setPage(1); },
                      },
                    ]}
                  />
                </div>
              </div>

              {/* [PRIMARY BUTTON] Add Student */}
              <div className="w-full md:w-auto md:ml-auto">
                <PrimaryButton
                  text="Add Student"
                  iconSrc="/add.svg"
                  onClick={handleAddStudent}
                  className="w-full md:w-auto"
                />
              </div>
            </div>
          </div>
        }
        footer={
          // [COMPONENT] Pagination
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            getVisiblePages={getVisiblePages}
          />
        }>
        <div className="space-y-3">
          {/* [SECTION] Student Cards (Mobile View) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {!loading && displayedStudents.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No students found"
                  subtitle="No students match your current filters or search."
                />
              </div>
            )}

            {displayedStudents.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                onClick={() => navigate(`/admin/students/view/${s.id}`)}
              />
            ))}
          </div>

          {/* [SECTION] Students Table (Desktop View) */}
          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {!loading && displayedStudents.length === 0 && (
              <EmptyState
                title="No students found"
                subtitle="No students match your current filters or search."
              />
            )}

            {displayedStudents.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    {/* [SECTION] Table Headers */}
                    <th className="table-header">Name</th>
                    <th className="table-header">LRN</th>
                    <th className="table-header">Grade, Section & Curriculum</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Adviser</th>
                  </tr>
                </thead>

                {/* [SECTION] Table Body */}
                <tbody>
                  {displayedStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition"
                    >
                      <td
                        onClick={() =>
                          navigate(`/admin/students/view/${s.id}`)
                        }
                        className="table-cell table-text table-text-link cursor-pointer hover:underline"
                      >
                        {s.fullName}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {s.lrn}
                      </td>

                      <td
                        onClick={() =>
                          s.enrollments?.[0]?.section?.id &&
                          navigate(`/admin/sections/view/${s.enrollments[0].section.id}`)
                        }
                        className="table-cell table-text text-[var(--color-text-600)] cursor-pointer hover:underline hover:text-[var(--color-primary-700)] transition"
                      >
                        {s.enrollments?.[0]?.section
                          ? `Grade ${s.enrollments[0].section.gradeLevel} - ${s.enrollments[0].section.name}`
                          : "—"}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {s.email ?? "—"}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {s.adviser?.name ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default AdminStudents;