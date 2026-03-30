// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import CrudModal from "../../components/CrudModal";
import DeleteButton from "../../components/DeleteButton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// ?[INTERFACES]
interface SectionStudent {
  id: number;
  lrn: string;
  fullName: string;
  sex?: string;
  status: string;
  learningModality: string;
}

interface SectionDetails {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  learningModality: string;
  classSize: number;
  room?: string;
  createdAt: string;
  adviser?: { id: number; name: string; adviserId: string };
  students: SectionStudent[];
}

// *[COMPONENT] Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const color =
    status === "ENROLLED"
      ? "bg-green-100 text-green-700"
      : status === "DROPPED"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};

// ?[TYPE] Form pages
type FormPage = 0 | 1;

const PAGE_LABELS: [string, string] = [
  "Section Info",
  "Configuration",
];

const gradeLevelOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const curriculumOptions = ["K-12", "SHS STEM", "SHS ABM", "SHS HUMSS", "SHS GAS", "SHS TVL", "SHS Sports", "SHS Arts"];
const learningModalityOptions = ["Face to Face", "Distance Learning", "Blended", "Online", "Homeschool", "Other"];

// *[PAGE] Admin Section Details
const AdminSectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [section, setSection] = useState<SectionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] CrudModal — confirmations (delete, errors)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "error" | "success" | "info" | "warning">("default");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  // [STATES] Identity card — pagination & edit mode
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SectionDetails>>({});

  // [FETCH] Section by id
  const fetchSection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch section");
      setSection(data.data);
      setFormData(data.data);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching section");
      setModalMessage("An error occurred while loading section details.");
      setModalType("error");
      setIsCancelable(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSection();
  }, [id]);

  // [HANDLE] Delete section
  const handleDelete = () => {
    setModalTitle("Delete Section");
    setModalMessage("Are you sure you want to delete this section? This action cannot be undone.");
    setModalType("error");
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
        navigate("/admin/sections");
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
      setFormData(section ?? {});
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Save edits
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update section");
      setSection({ ...section!, ...formData });
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
  const handleFieldChange = (field: keyof SectionDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // *[BREADCRUMBS] Admin Section Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Sections", path: "/admin/sections" },
    { label: section?.name ?? "Details", path: null },
  ];

  // *[RENDER] Form fields per page
  const renderFormPage = () => {
    if (!section) return null;

    if (activePage === 0) {
      // Section Info
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="Section Name"
              value={formData.name ?? ""}
              onChange={handleFieldChange("name")}
              placeholder="e.g. Rizal, Mabini"
              disabled={!isEditing}
              required
            />
          </div>
          <InputField
            label="Grade Level"
            type="select"
            value={formData.gradeLevel ? String(formData.gradeLevel) : ""}
            onChange={handleFieldChange("gradeLevel")}
            placeholder="Select grade level"
            options={gradeLevelOptions.map(g => `Grade ${g}`)}
            disabled={!isEditing}
            required
          />
          <InputField
            label="School Year"
            value={formData.schoolYear ?? ""}
            onChange={handleFieldChange("schoolYear")}
            placeholder="e.g. 2024–2025"
            disabled={!isEditing}
            required
          />
          <InputField
            label="Room"
            value={formData.room ?? ""}
            onChange={handleFieldChange("room")}
            placeholder="e.g. Room 101"
            disabled={!isEditing}
          />
        </div>
      );
    }

    if (activePage === 1) {
      // Configuration
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Curriculum"
            type="select"
            value={formData.curriculum ?? ""}
            onChange={handleFieldChange("curriculum")}
            placeholder="Select curriculum"
            options={curriculumOptions}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Learning Modality"
            type="select"
            value={formData.learningModality ?? ""}
            onChange={handleFieldChange("learningModality")}
            placeholder="Select modality"
            options={learningModalityOptions}
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
          <h2 className="text-[var(--color-text-800)] leading-0">Section Details</h2>
          <nav className="font-roboto text-sm text-[var(--color-text-700)]">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx}>
                {crumb.path ? (
                  <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>
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

        {section ? (
          <>
            {/* [SECTION HEADER] Name + grade badge */}
            <div className="bg-[var(--color-bg-100)] rounded-lg px-4 py-4 flex items-center gap-4">
              <div className="size-14 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-2xl border border-[var(--color-primary-200)] flex-shrink-0">
                {section.gradeLevel}
              </div>
              <div>
                <p className="text-xl font-bold font-roboto text-[var(--color-text-900)]">{section.name}</p>
                <p className="text-sm font-roboto text-[var(--color-text-600)]">
                  Grade {section.gradeLevel} · {section.curriculum} · {section.schoolYear}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* [BUTTON] Delete */}
              <DeleteButton onClick={handleDelete} text="Delete Section" disabled={loading} />
            </div>

            {/* [CARD] Section Identity */}
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
                    className={`text-xs font-roboto font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEditing
                        ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                        : "text-[var(--color-text-50)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)]"
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
              {section.adviser ? (
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-md bg-[var(--color-bg-200)] flex items-center justify-center text-[var(--color-text-700)] font-bold text-sm flex-shrink-0">
                    {section.adviser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-roboto font-medium text-[var(--color-text-900)]">{section.adviser.name}</p>
                    <p className="text-xs font-mono text-[var(--color-text-500)]">#{section.adviser.adviserId}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-roboto text-[var(--color-text-600)]">No adviser assigned</p>
              )}
            </div>

            {/* [CARD] Students */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Students ({section.classSize})
              </p>
              {section.students.length === 0 ? (
                <p className="text-sm font-roboto text-[var(--color-text-600)]">No students enrolled.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {section.students.map((student) => (
                    <div
                      key={student.id}
                      className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-roboto font-semibold text-[var(--color-text-900)] truncate">
                          {student.fullName}
                        </p>
                        <p className="text-xs font-mono text-[var(--color-text-500)]">
                          LRN {student.lrn}
                        </p>
                        <p className="text-xs font-roboto text-[var(--color-text-500)]">
                          {student.learningModality}
                        </p>
                      </div>
                      <StatusBadge status={student.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* [META] Created At */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Created{" "}
              {new Date(section.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </>
        ) : (
          // [EMPTY STATE]
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Section not found.</p>
            <button
              onClick={() => navigate("/admin/sections")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Sections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSectionDetails;