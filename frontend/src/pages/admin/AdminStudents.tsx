/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import Dropdown from "../../components/Dropdown";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import Breadcrumbs from "../../components/Breadcrumbs";
import BulkActionsBar from "../../components/BulkActionsBar";
import StudentCard from "../../components/cards/StudentCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import StudentFormModal from "../../components/forms/StudentFormModal";
import AdminPageLayout from "../../components/layouts/AdminPageLayout";

// [IMPORT] Helpers, Constants & Types
import { getVisiblePages } from "../../helpers/index";
import { SEX_OPTIONS } from "../../constants";
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
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "sex" | null>(null);
  const [selectedSex, setSelectedSex] = useState<string | "All">("All");

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
  const itemsPerPage = 5;

  // [STATE] Selected Students (for bulk actions)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // * [HANDLE] Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students?limit=200`, {
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
      (selectedSex === "All" || s.sex === selectedSex)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return (a.fullName || "").localeCompare(b.fullName || "");
        case "name-desc": return (b.fullName || "").localeCompare(a.fullName || "");
        case "lrn-asc": return a.lrn.localeCompare(b.lrn);
        case "lrn-desc": return b.lrn.localeCompare(a.lrn);
        default: return 0;
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
      <AdminPageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Students" />
        }
        toolbar={
          <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 md:gap-4 w-full">
                {/* [COMPONENT] Search Bar */}
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={search}
                    placeholder="Search by name, LRN, or email..."
                    onChange={setSearch}
                    onResetPage={() => setPage(1)}
                  />
                </div>

                {/* [COMPONENT] Sort Dropdown */}
                <div className="flex gap-x-2 ml-auto">
                  <Dropdown
                    icon="/sort-icon.svg"
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
                      { label: "Name ↑", value: "name-asc" },
                      { label: "Name ↓", value: "name-desc" },
                      { label: "LRN ↑", value: "lrn-asc" },
                      { label: "LRN ↓", value: "lrn-desc" },
                    ]}
                  />

                  {/* [COMPONENT] Filter Dropdown */}
                  <Dropdown
                    icon="/filter-icon.svg"
                    label="Filter"
                    isOpen={activeDropdown === "sex"}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === "sex" ? null : "sex")
                    }
                    selected={selectedSex}
                    onSelect={(value) => {
                      setSelectedSex(value);
                      setPage(1);
                    }}
                    width="w-32"
                    options={[{ label: "All", value: "All" }, ...SEX_OPTIONS]}
                  />
                </div>
              </div>

              {/* [PRIMARY BUTTON] Add Student */}
              <div className="w-full md:w-auto md:ml-auto">
                <PrimaryButton
                  text="Add Student"
                  iconSrc="/add-icon.svg"
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
          {/* [COMPONENT] Bulk Actions */}
          <BulkActionsBar
            selectedCount={selectedStudents.length}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedStudents([])}
          />

          {/* [SECTION] Student Cards (Mobile View) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {!loading && displayedStudents.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No students found"
                  subtitle="No students match your current filters or search."
                  iconSrc="/no-data-icon.svg"
                />
              </div>
            )}

            {displayedStudents.map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
          </div>

          {/* [SECTION] Students Table (Desktop View) */}
          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {!loading && displayedStudents.length === 0 && (
              <EmptyState
                title="No students found"
                subtitle="No students match your current filters or search."
                iconSrc="/no-data-icon.svg"
              />
            )}

            {displayedStudents.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={
                          displayedStudents.length > 0 &&
                          displayedStudents.every(s =>
                            selectedStudents.includes(s.id)
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(prev => [
                              ...new Set([
                                ...prev,
                                ...displayedStudents.map(s => s.id),
                              ]),
                            ]);
                          } else {
                            setSelectedStudents(prev =>
                              prev.filter(
                                id =>
                                  !displayedStudents.some(s => s.id === id)
                              )
                            );
                          }
                        }}
                      />
                    </th>

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
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, s.id]);
                            } else {
                              setSelectedStudents(prev =>
                                prev.filter(id => id !== s.id)
                              );
                            }
                          }}
                        />
                      </td>

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

                      <td className="table-cell table-text table-text-default">
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
      </AdminPageLayout>
    </>
  );
};

export default AdminStudents;