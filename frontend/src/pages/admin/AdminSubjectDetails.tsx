// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import DeleteButton from "../../components/DeleteButton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// [IMPORT] Constants & Types
import { gradeLevelOptions, curriculumOptions } from "../../constants";

// ?[INTERFACES]
// Mirrors the LearningArea model from the backend (schema.prisma)
interface LearningAreaDetails {
  id: number;
  name: string;
  gradeLevel: number;
  curriculum: string;
  writtenWorkWeight: number;
  performanceTaskWeight: number;
  quarterlyAssessmentWeight: number;
}

// ?[TYPE] Form pages
type FormPage = 0 | 1;

const PAGE_LABELS: [string, string] = [
  "Subject Info",
  "Grading Weights",
];

// *[COMPONENT] Weight Row — label + hint + InputField + live % badge
const WeightRow = ({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: string) => void;
  disabled: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-roboto text-[var(--color-text-900)]">{label}</span>
      <span className="text-xs font-roboto text-[var(--color-text-500)]">{hint}</span>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-24">
        <InputField
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          max={1}
          disabled={disabled}
          showClear={false}
        />
      </div>
      <span className="text-xs font-roboto text-[var(--color-text-500)] w-10 text-right flex-shrink-0">
        {value !== undefined ? `${Math.round(Number(value) * 100)}%` : "—"}
      </span>
    </div>
  </div>
);

const AdminSubjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // [STATES]
  const [subject, setSubject] = useState<LearningAreaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Modal
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
  const [formData, setFormData] = useState<Partial<LearningAreaDetails>>({});

  // [FETCH] Learning area by id
  const fetchSubject = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch subject");
      setSubject(data.data);
      setFormData(data.data);
    } catch (err) {
      console.error(err);
      setModalTitle("Error Fetching Subject");
      setModalMessage("An error occurred while loading subject details.");
      setModalType("error");
      setModalConfirmText("OK");
      setIsCancelable(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  // [HANDLE] Delete learning area
  const handleDelete = () => {
    setModalTitle("Delete Subject");
    setModalMessage("Are you sure you want to delete this subject? This action cannot be undone.");
    setModalType("error");
    setModalConfirmText("Delete");
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
        navigate("/admin/subjects");
      } catch (err) {
        console.error("Delete error:", err);
        setModalTitle("Delete Failed");
        setModalMessage("An error occurred while deleting this subject. Please try again.");
        setModalType("error");
        setModalConfirmText("OK");
        setIsCancelable(false);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onDeleteConfirm);
  };

  // [HANDLE] Edit toggle — discard changes on cancel
  const handleEditToggle = () => {
    if (isEditing) {
      setFormData(subject ?? {});
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Save edits
  const handleSave = async () => {
    // [VALIDATE] Weights must sum to 1.0 (100%) before hitting the backend
    const weightSum =
      Number(formData.writtenWorkWeight ?? 0) +
      Number(formData.performanceTaskWeight ?? 0) +
      Number(formData.quarterlyAssessmentWeight ?? 0);

    if (Math.abs(weightSum - 1.0) >= 0.001) {
      setModalTitle("Invalid Weights");
      setModalMessage(`Grading weights must sum to 100%. Current total: ${Math.round(weightSum * 100)}%.`);
      setModalType("warning");
      setModalConfirmText("OK");
      setIsCancelable(false);
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          // [NOTE] gradeLevel and curriculum are not sent — they are immutable
          // after creation (part of the unique constraint: name + gradeLevel + curriculum)
          writtenWorkWeight: Number(formData.writtenWorkWeight),
          performanceTaskWeight: Number(formData.performanceTaskWeight),
          quarterlyAssessmentWeight: Number(formData.quarterlyAssessmentWeight),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update subject");

      // [UPDATE] Merge saved changes back into the subject state
      setSubject({ ...subject!, ...formData } as LearningAreaDetails);
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      setModalTitle("Update Failed");
      setModalMessage("An error occurred while saving changes. Please try again.");
      setModalType("error");
      setModalConfirmText("OK");
      setIsCancelable(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Generic text / select field change
  const handleFieldChange = (field: keyof LearningAreaDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // [HANDLE] Numeric weight field change — casts to number immediately
  const handleWeightChange = (field: keyof LearningAreaDetails) =>
    (v: string) => {
      setFormData((prev) => ({ ...prev, [field]: v === "" ? 0 : Number(v) }));
    };

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // [COMPUTED] Live weight sum for the Grading Weights page indicator
  const weightSum =
    Number(formData.writtenWorkWeight ?? 0) +
    Number(formData.performanceTaskWeight ?? 0) +
    Number(formData.quarterlyAssessmentWeight ?? 0);
  const weightsAreValid = Math.abs(weightSum - 1.0) < 0.001;

  // *[BREADCRUMBS] Admin Subject Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Subjects", path: "/admin/subjects" },
    { label: subject?.name ?? "Details", path: null },
  ];

  // *[RENDER] Form fields per page
  const renderFormPage = () => {
    if (!subject) return null;

    if (activePage === 0) {
      // [PAGE 0] Subject Info
      // name → editable | gradeLevel + curriculum → locked (unique constraint)
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="Subject Name"
              value={formData.name ?? ""}
              onChange={handleFieldChange("name")}
              placeholder="e.g. Mathematics, Filipino, Science"
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
            disabled
          />
          <InputField
            label="Curriculum"
            type="select"
            value={formData.curriculum ?? ""}
            onChange={handleFieldChange("curriculum")}
            placeholder="Select curriculum"
            options={curriculumOptions.map(opt => opt.label)}
            disabled
          />
          {/* [HINT] Grade level and curriculum are locked after creation */}
          <p className="col-span-2 sm:col-span-3 text-xs font-roboto text-[var(--color-text-500)]">
            Grade level and curriculum cannot be changed — they are part of the subject's unique identity.
          </p>
        </div>
      );
    }

    if (activePage === 1) {
      // [PAGE 1] Grading Weights
      // WW + PT + QA must always sum to 1.0 (100%)
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <WeightRow
              label="Written Work"
              hint="e.g. quizzes, seatwork, homework"
              value={formData.writtenWorkWeight ?? 0}
              onChange={handleWeightChange("writtenWorkWeight")}
              disabled={!isEditing}
            />
            <WeightRow
              label="Performance Task"
              hint="e.g. projects, experiments, recitation"
              value={formData.performanceTaskWeight ?? 0}
              onChange={handleWeightChange("performanceTaskWeight")}
              disabled={!isEditing}
            />
            <WeightRow
              label="Quarterly Assessment"
              hint="quarterly exam / summative test"
              value={formData.quarterlyAssessmentWeight ?? 0}
              onChange={handleWeightChange("quarterlyAssessmentWeight")}
              disabled={!isEditing}
            />
          </div>

          {/* [UI] Live weight sum indicator */}
          <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-roboto font-medium ${
            weightsAreValid
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            <span>Total</span>
            <span>
              {Math.round(weightSum * 100)}%{" "}
              {weightsAreValid ? "✓" : `— needs ${Math.round((1 - weightSum) * 100)}% more`}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* [MODAL] General — confirmations, errors, warnings */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
        onConfirm={onConfirmAction}
        closeOnBackdrop={false}
        isCancelable={isCancelable}
      />

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">Subject Details</h2>
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

        {subject ? (
          <>
            {/* [SUBJECT HEADER] Name + grade badge + curriculum pill */}
            <div className="bg-[var(--color-bg-100)] rounded-lg px-4 py-4 flex items-center gap-4">
              <div className="size-14 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-lg border border-[var(--color-primary-200)] flex-shrink-0 text-center leading-tight">
                G{subject.gradeLevel}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold font-roboto text-[var(--color-text-900)] truncate">
                  {subject.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-roboto text-[var(--color-text-600)]">
                    Grade {subject.gradeLevel}
                  </span>
                  <span className="text-[var(--color-text-400)]">·</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                    {subject.curriculum}
                  </span>
                </div>
              </div>
            </div>

            {/* [BUTTON] Delete */}
            <div className="space-y-2">
              <DeleteButton onClick={handleDelete} text="Delete Subject" disabled={loading} />
            </div>

            {/* [CARD] Subject Identity */}
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

              {/* [HEADER] Section title + Edit / Save / Cancel buttons */}
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
          </>
        ) : (
          // [EMPTY STATE]
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Subject not found.</p>
            <button
              onClick={() => navigate("/admin/subjects")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Subjects
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubjectDetails;