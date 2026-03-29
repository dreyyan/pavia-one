// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import CrudModal from "../../components/CrudModal";
import ProfileInfo from "../../components/ProfileInfo";
import PrimaryButton from "../../components/PrimaryButton";
import DeleteButton from "../../components/DeleteButton";

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
}

// *[COMPONENT] Info Row
const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)]">
      {label}
    </span>
    <span className="text-sm font-roboto text-[var(--color-text-900)]">
      {value ?? "—"}
    </span>
  </div>
);

// *[COMPONENT] Section Badge
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

// *[PAGE] Admin Student Details
const AdminStudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] CrudModal — confirmations (delete, errors)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  // [FETCH] Student by id
  const fetchStudent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch student");
      setStudent(data.data);
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
        if (!data.success) throw new Error(data.message || "Failed to delete student");
        navigate("/admin/students");
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
  if (loading) return <Skeleton />;

  // [COMPUTED] Initials for avatar
  const initials = student?.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  // [COMPUTED] Formatted birth date
  const formattedBirthDate = student?.birthDate
    ? new Date(student.birthDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  // *[BREADCRUMBS] Admin Student Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Students", path: "/admin/students" },
    { label: student?.fullName ?? "Details", path: null },
  ];

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
              <PrimaryButton text="Export SF9" iconSrc="/export-icon-white.svg" onClick={() => navigate(`/admin/students/${id}/export-sf9`)} />

              {/* [BUTTON] Delete */}
              <DeleteButton onClick={handleDelete} disabled={loading} />
            </div>

            {/* [CARD] Student Identity */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [DIVIDER] */}
              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [GRID] Personal Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="First Name" value={student.firstName} />
                <InfoRow label="Middle Name" value={student.middleName} />
                <InfoRow label="Last Name" value={student.lastName} />
                <InfoRow label="Name Extension" value={student.nameExtension} />
                <InfoRow label="Birth Date" value={formattedBirthDate} />
                <InfoRow label="Email" value={student.email} />
              </div>

              {/* [DIVIDER] */}
              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [SECTION] Adviser */}
              <div>
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-2">
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