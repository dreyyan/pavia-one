/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import CrudModal from "../../components/CrudModal";
import ProfileInfo from "../../components/ProfileInfo";
import PrimaryButton from "../../components/PrimaryButton";
import DeleteButton from "../../components/DeleteButton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";

// ?[INTERFACES]
interface Enrollment {
  id: number;
  sectionId: number;
  schoolYear: string;
  status: string;
  learningModality: string;
  section?: {
    id: number;
    name: string;
    gradeLevel: number;
    curriculum: string;
  };
}

interface StudentDetails {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  sex?: string;
  birthDate?: string;
  email?: string;
  createdByAdviserId: string;
  createdAt: string;
  adviser?: { id: number; name: string; adviserId: string };
  enrollments: Enrollment[];
  // Address
  houseStreet?: string;
  barangay?: string;
  municipalityCity?: string;
  province?: string;
  // Basic Info extras
  motherTongue?: string;
  ipEthnicGroup?: string;
  religion?: string;
  // Parents
  fatherLastName?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  motherLastName?: string;
  motherFirstName?: string;
  motherMiddleName?: string;
  guardianLastName?: string;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  contactNumber?: string;
}

// ?[TYPE] Form pages
type FormPage = 0 | 1 | 2;

const PAGE_LABELS: [string, string, string] = [
  "Basic Information",
  "Address",
  "Parents",
];

// *[PAGE] Admin Student Details
const AdminStudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // [STATES]
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] CrudModal: Confirmations
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "error" | "success" | "info" | "warning">("default");
  const [modalConfirmText, setModalConfirmText] = useState("OK");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  // [STATES] Identity card — pagination & edit mode
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentDetails>>({});

  // * [HANDLE] Fetch student details by id
  const fetchStudent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch student");
      setStudent(data.data);
      setFormData(data.data);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching student");
      setIsCancelable(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  // [HANDLE] Delete student
  const handleDelete = () => {
    setModalTitle("Delete Student");
    setModalMessage("Are you sure you want to delete this student? This action cannot be undone.");
    setModalType("error");
    setModalConfirmText("Delete");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // ! [ERROR] Backend failure response
        if (!data.success) throw new Error(data.message || "Failed to delete student");

        // * [SUCCESS] Show success modal before navigating back to list
        setModalTitle("Delete Student");
        setModalMessage("Student deleted successfully.");
        setModalType("success");
        setModalConfirmText("OK");
        setIsCancelable(true);

        setOnConfirmAction(() => async () => {
          setShowModal(false);
          navigate("/admin/students");
        });

        setShowModal(true);
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

  // [HANDLE] Edit toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes
      setFormData(student ?? {});
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Save edits
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update student");
      setStudent({ ...student!, ...formData });
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      setModalTitle("Update Failed");
      setIsCancelable(true);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Generic form field change
  const handleFieldChange = (field: keyof StudentDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // *[BREADCRUMBS] Admin Student Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Students", path: "/admin/students" },
    { label: student?.fullName ?? "Details", path: null },
  ];

  // *[RENDER] Form fields per page
  const renderFormPage = () => {
    if (!student) return null;

    if (activePage === 0) {
      // Basic Information
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* [COMPONENT] Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={modalTitle}
            message={modalMessage}
            type={modalType}
            confirmText={modalConfirmText}
            onConfirm={onConfirmAction}
            isCancelable={isCancelable}
          />
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="LRN"
              type="number"
              value={formData.lrn ?? ""}
              onChange={handleFieldChange("lrn")}
              placeholder="Learner Reference Number"
              maxLength={12}
              disabled={!isEditing}
              required
            />
          </div>
          <InputField
            label="Last Name"
            value={formData.lastName ?? ""}
            onChange={handleFieldChange("lastName")}
            placeholder="Last Name"
            disabled={!isEditing}
            required
          />
          <InputField
            label="First Name"
            value={formData.firstName ?? ""}
            onChange={handleFieldChange("firstName")}
            placeholder="First Name"
            disabled={!isEditing}
            required
          />
          <InputField
            label="Middle Name"
            value={formData.middleName ?? ""}
            onChange={handleFieldChange("middleName")}
            placeholder="Middle Name"
            disabled={!isEditing}
          />
          <InputField
            label="Name Extension"
            type="select"
            value={formData.nameExtension ?? ""}
            onChange={handleFieldChange("nameExtension")}
            placeholder="e.g. Jr., Sr."
            options={["Jr.", "Sr.", "II", "III", "IV"]}
            disabled={!isEditing}
          />
          <InputField
            label="Sex"
            type="select"
            value={formData.sex ?? ""}
            onChange={handleFieldChange("sex")}
            placeholder="Select sex"
            options={["Male", "Female"]}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Birth Date"
            type="date"
            value={formData.birthDate ? formData.birthDate.slice(0, 10) : ""}
            onChange={handleFieldChange("birthDate")}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Mother Tongue (Grade 1–3)"
            value={formData.motherTongue ?? ""}
            onChange={handleFieldChange("motherTongue")}
            placeholder="Mother Tongue"
            disabled={!isEditing}
          />
          <InputField
            label="IP (Ethnic Group)"
            value={formData.ipEthnicGroup ?? ""}
            onChange={handleFieldChange("ipEthnicGroup")}
            placeholder="Ethnic Group"
            disabled={!isEditing}
          />
          <InputField
            label="Religion"
            value={formData.religion ?? ""}
            onChange={handleFieldChange("religion")}
            placeholder="Religion"
            disabled={!isEditing}
          />
        </div>
      );
    }

    if (activePage === 1) {
      // Address
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <InputField
              label="House # / Street / Sitio / Purok"
              value={formData.houseStreet ?? ""}
              onChange={handleFieldChange("houseStreet")}
              placeholder="House #, Street, Sitio or Purok"
              disabled={!isEditing}
            />
          </div>
          <InputField
            label="Barangay"
            value={formData.barangay ?? ""}
            onChange={handleFieldChange("barangay")}
            placeholder="Barangay"
            disabled={!isEditing}
          />
          <InputField
            label="Municipality / City"
            value={formData.municipalityCity ?? ""}
            onChange={handleFieldChange("municipalityCity")}
            placeholder="Municipality or City"
            disabled={!isEditing}
          />
          <div className="col-span-1 sm:col-span-2">
            <InputField
              label="Province"
              value={formData.province ?? ""}
              onChange={handleFieldChange("province")}
              placeholder="Province"
              disabled={!isEditing}
            />
          </div>
        </div>
      );
    }

    if (activePage === 2) {
      // Parents
      return (
        <div className="space-y-5">
          {/* Father */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Father's Name
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Last Name"
                value={formData.fatherLastName ?? ""}
                onChange={handleFieldChange("fatherLastName")}
                placeholder="Last Name"
                disabled={!isEditing}
              />
              <InputField
                label="First Name"
                value={formData.fatherFirstName ?? ""}
                onChange={handleFieldChange("fatherFirstName")}
                placeholder="First Name"
                disabled={!isEditing}
              />
              <InputField
                label="Middle Name"
                value={formData.fatherMiddleName ?? ""}
                onChange={handleFieldChange("fatherMiddleName")}
                placeholder="Middle Name"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Mother */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Mother's Maiden Name
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Last Name"
                value={formData.motherLastName ?? ""}
                onChange={handleFieldChange("motherLastName")}
                placeholder="Last Name"
                disabled={!isEditing}
              />
              <InputField
                label="First Name"
                value={formData.motherFirstName ?? ""}
                onChange={handleFieldChange("motherFirstName")}
                placeholder="First Name"
                disabled={!isEditing}
              />
              <InputField
                label="Middle Name"
                value={formData.motherMiddleName ?? ""}
                onChange={handleFieldChange("motherMiddleName")}
                placeholder="Middle Name"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Guardian */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Guardian's Name{" "}
              <span className="normal-case font-normal text-[var(--color-text-400)]">
                (if not Parent)
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Last Name"
                value={formData.guardianLastName ?? ""}
                onChange={handleFieldChange("guardianLastName")}
                placeholder="Last Name"
                disabled={!isEditing}
              />
              <InputField
                label="First Name"
                value={formData.guardianFirstName ?? ""}
                onChange={handleFieldChange("guardianFirstName")}
                placeholder="First Name"
                disabled={!isEditing}
              />
              <InputField
                label="Middle Name"
                value={formData.guardianMiddleName ?? ""}
                onChange={handleFieldChange("guardianMiddleName")}
                placeholder="Middle Name"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Contact */}
          <InputField
            label="Contact Number of Parent / Guardian"
            type="number"
            value={formData.contactNumber ?? ""}
            onChange={handleFieldChange("contactNumber")}
            placeholder="e.g. 09XXXXXXXXX"
            maxLength={11}
            disabled={!isEditing}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* [CRUD MODAL] Confirmations (Delete/Error) */}
      <CrudModal
        isOpen={showModal}
        title={modalTitle}
        isCancelable={isCancelable}
        onClose={() => setShowModal(false)}
        onConfirm={onConfirmAction}
        loading={loading}
        showForm={false}
      />
      {/* [COMPONENT] Modal */}
      {showModal && (
          <Modal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              type={modalType}
              title={modalTitle}
              message={modalMessage}
              closeOnBackdrop={false}
              isCancelable={isCancelable}
          />
      )}

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">Student Details</h2>
          <nav className="font-roboto text-sm text-[var(--color-text-700)]">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx}>
                {crumb.path ? (
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => navigate(crumb.path!)}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && " / "}
              </span>
            ))}
          </nav>
        </div>

        {student ? (
          <>
            {/* [COMPONENT] Profile Info */}
            <ProfileInfo lastName={student.lastName} firstName={student.firstName} />

            <div className="space-y-2">
              {/* [PRIMARY BUTTON] Export SF9 */}
              <PrimaryButton
                text="Export SF9"
                iconSrc="/export-icon-white.svg"
                onClick={() => console.log("Exporting SF9... (not implemented)")}
              />

              {/* [BUTTON] Delete */}
              <DeleteButton onClick={handleDelete} text="Delete Student" disabled={loading} />
            </div>

            {/* [CARD] Student Identity */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [PAGINATION] Page tabs */}
              <div className="flex gap-1 bg-[var(--color-bg-200)] rounded-lg p-1">
                {PAGE_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePage(idx as FormPage)}
                    className={`flex-1 text-xs font-roboto font-medium py-1.5 px-2 rounded-md transition-all duration-150 cursor-pointer ${
                      activePage === idx
                        ? "bg-[var(--color-bg-50)] text-[var(--color-text-900)] shadow-sm"
                        : "text-[var(--color-text-600)] hover:text-[var(--color-text-800)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* [DIVIDER] */}
              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [HEADER] Section title + Edit button */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                  {PAGE_LABELS[activePage]}
                </p>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="text-xs font-roboto font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  )}
                  <button
                    onClick={handleEditToggle}
                    disabled={loading}
                    className={`bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-xs font-roboto font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEditing
                        ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                        : "text-[var(--color-text-50)] hover:bg-[var(--color-accent-700)]"
                    }`}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>

              {/* [FORM] Dynamic fields based on active page */}
              {renderFormPage()}

            </div>

            {/* [CARD] Adviser */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Adviser
              </p>
              {student.adviser ? (
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-md bg-[var(--color-bg-200)] flex items-center justify-center text-[var(--color-text-700)] font-bold text-sm flex-shrink-0">
                    {student.adviser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-roboto font-medium text-[var(--color-text-900)]">
                      {student.adviser.name}
                    </p>
                    <p className="text-xs font-mono text-[var(--color-text-500)]">
                      #{student.adviser.adviserId}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-roboto text-[var(--color-text-600)]">No adviser assigned</p>
              )}
            </div>

            {/* [CARD] Enrollments */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Enrollment History
              </p>

              {student.enrollments.length === 0 ? (
                <p className="text-sm font-roboto text-[var(--color-text-600)]">No enrollment records.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {student.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-roboto font-semibold text-[var(--color-text-900)] truncate">
                          {enrollment.section?.name ?? `Section #${enrollment.sectionId}`}
                        </p>
                        <p className="text-xs font-roboto text-[var(--color-text-600)]">
                          {enrollment.section
                            ? `Grade ${enrollment.section.gradeLevel} · ${enrollment.section.curriculum}`
                            : "—"}
                          {" · "}
                          {enrollment.schoolYear}
                        </p>
                        <p className="text-xs font-roboto text-[var(--color-text-500)]">
                          {enrollment.learningModality}
                        </p>
                      </div>
                      <StatusBadge status={enrollment.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* [META] Created At */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Registered{" "}
              {new Date(student.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </>
        ) : (
          // [EMPTY STATE]
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Student not found.</p>
            <button
              onClick={() => navigate("/admin/students")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Students
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentDetails;