/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

// [IMPORT] React
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import DashboardItem from "../../components/DashboardItem";

// [IMPORT] Constants, Types, Helpers
import { GeneralModalConfig, SchoolFormType, SchoolFormStatus, SectionForm, StudentFormStatus } from "../../types";
import { FORM_STATUS_BADGE, FORM_STATUS_LABELS } from "../../constants/index";
import { safeJson } from "../../helpers/index";
import SectionInfoCard from "../../components/cards/SectionInfoCard";

// ? [INTERFACES]
interface SectionDetail {
  id: number;
  name: string;
  gradeLevel: string;
  schoolYear: string;
  curriculum: string;
  learningModality: string;
  classSize: number;
  createdAt: string;
  adviser: { id: number; adviserId: string; name: string; email: string };
  schoolForms: SectionForm[];
}

interface StudentRow {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  sex: "MALE" | "FEMALE";
  enrollmentStatus: string;
  sf9Status: StudentFormStatus;
  sf10Status: StudentFormStatus;
  sf5Status: StudentFormStatus;
  generalAverage?: number;
  actionTaken?: string;
}

// [CONSTANTS]
const FORM_TYPE_LABELS: Record<SchoolFormType, string> = {
  SF1: "SF1 — Class Register",
  SF5: "SF5 — Report on Promotion",
};

const FORM_TYPE_DESCRIPTIONS: Record<SchoolFormType, string> = {
  SF1: "The master list of all enrolled students in the section for the school year.",
  SF5: "Records the action taken (promoted, conditional, retained) for each student at year-end.",
};

const STUDENT_FORM_LABELS: Record<StudentFormStatus, string> = {
  COMPLETE: "Complete",
  PARTIAL:  "Partial",
  PENDING:  "Pending",
};

const STUDENT_STATUS_BADGE: Record<StudentFormStatus, string> = {
  COMPLETE: "bg-green-100 text-green-700 border border-green-200",
  PARTIAL:  "bg-yellow-100 text-yellow-700 border border-yellow-200",
  PENDING:  "bg-[var(--color-bg-300)] text-[var(--color-text-500)] border border-[var(--color-bg-400)]",
};

const STATUS_FLOW: SchoolFormStatus[] = ["DRAFT", "GENERATED", "SUBMITTED", "APPROVED", "LOCKED"];

// [HELPER] Build full student name
const fullName = (s: Pick<StudentRow, "firstName" | "middleName" | "lastName" | "nameExtension">) =>
  [s.lastName, s.firstName, s.middleName, s.nameExtension].filter(Boolean).join(", ");

// [HELPER] Format date
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// [HELPER] Detect missing student-level info
const getStudentMissingFields = (student: StudentRow): string[] => {
  const missing: string[] = [];
  if (student.sf9Status  !== "COMPLETE") missing.push("SF9");
  if (student.sf10Status !== "COMPLETE") missing.push("SF10");
  if (student.sf5Status  !== "COMPLETE") missing.push("SF5");
  if (student.generalAverage == null)    missing.push("General Average");
  if (!student.actionTaken)              missing.push("Action Taken");
  return missing;
};

const AdminSchoolFormDetails = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  // [STATES] Data
  const [section, setSection]       = useState<SectionDetail | null>(null);
  const [students, setStudents]     = useState<StudentRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // [STATES] Student search & pagination
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage]     = useState(1);
  const studentItemsPerPage               = 5;

  // [STATES] Form status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget]       = useState<SectionForm | null>(null);
  const [pendingStatus, setPendingStatus]     = useState<SchoolFormStatus>("DRAFT");

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false, title: "", message: "", type: "default",
    confirmText: "OK", isCancelable: true, onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) =>
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  const closeGeneralModal = () =>
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));

  // * [HANDLE] Fetch section detail
  const fetchSectionDetail = async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-forms/section/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Failed to load section");
      setSection(data.data.section);
      setStudents(data.data.students ?? []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Section",
        message: "We couldn't load the section details. Please try again.",
        type: "error", confirmText: "Close", isCancelable: false,
        onConfirm: () => { closeGeneralModal(); navigate("/admin/school-forms"); },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSectionDetail(); }, [sectionId]);

  // * [HANDLE] Open status update modal
  const handleStatusClick = (form: SectionForm, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusTarget(form);
    setPendingStatus(form.status);
    setShowStatusModal(true);
  };

  // * [HANDLE] Submit form status update
  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-forms/${statusTarget.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: pendingStatus }),
        }
      );
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Update failed");

      setShowStatusModal(false);
      await fetchSectionDetail();
      openGeneralModal({
        title: "Status Updated",
        message: `Form status updated to "${FORM_STATUS_LABELS[pendingStatus]}".`,
        type: "success", isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      console.error(err);
      openGeneralModal({
        title: "Update Failed",
        message: err.message || "Could not update form status. Please try again.",
        type: "error", isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // [DERIVED] Filtered students
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.lrn.includes(q) ||
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q)
    );
  });

  // [PAGINATION] Student cards
  const totalStudentPages     = Math.ceil(filteredStudents.length / studentItemsPerPage);
  const displayedStudents     = filteredStudents.slice((studentPage - 1) * studentItemsPerPage, studentPage * studentItemsPerPage);
  const handleStudentPrevPage = () => setStudentPage((p) => Math.max(p - 1, 1));
  const handleStudentNextPage = () => setStudentPage((p) => Math.min(p + 1, totalStudentPages));

  // [DERIVED] Student completion summary
  const totalStudents    = students.length;
  const completeStudents = students.filter((s) => getStudentMissingFields(s).length === 0).length;
  const partialStudents  = students.filter((s) => {
    const m = getStudentMissingFields(s);
    return m.length > 0 && m.length < 5;
  }).length;
  const pendingStudents  = students.filter((s) => getStudentMissingFields(s).length === 5).length;

  if (loading) return <Skeleton />;

  return (
    <div>
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

      {/* [MODAL] Update Form Status */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Form Status"
        type="default"
        confirmText={submitting ? "Saving..." : "Save"}
        onConfirm={handleStatusUpdate}
        isCancelable={!submitting}
      >
        <div className="p-1 space-y-3">
          {statusTarget && (
            <p className="text-sm text-[var(--color-text-600)]">
              Updating status for{" "}
              <span className="font-bold text-[var(--color-text-900)]">
                {FORM_TYPE_LABELS[statusTarget.type]}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPendingStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  pendingStatus === s
                    ? FORM_STATUS_BADGE[s] + " ring-2 ring-offset-1 ring-[var(--color-primary-400)]"
                    : "bg-[var(--color-bg-100)] text-[var(--color-text-500)] border-[var(--color-text-200)] hover:bg-[var(--color-bg-200)]"
                }`}
              >
                {FORM_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-tight">School Forms</h2>
          <nav className="font-roboto text-sm text-[var(--color-text-700)]">
            <span className="cursor-pointer hover:underline" onClick={() => navigate("/admin/school-forms")}>
              School Forms
            </span>
            {" / "}
            <span className="font-medium text-[var(--color-text-900)]">
              {section ? `Grade ${section.gradeLevel} — ${section.name}` : "Section Detail"}
            </span>
          </nav>
        </div>

        {section && (
          <div className="space-y-4">

            {/* [CARD] Section Info */}
            <SectionInfoCard section={section} totalStudents={totalStudents} />

            {/* [SECTION] Student Completion Overview */}
            {totalStudents > 0 && (
              <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 shadow-md">
                <h2 className="mb-3">Student Overview</h2>
                <div className="space-y-2">
                  <DashboardItem iconSrc="/total-students-icon.svg" text="Total Students"    value={totalStudents} />
                  <DashboardItem iconSrc="/check-icon.svg"          text="Complete"          value={completeStudents} color="#28A428" />
                  <DashboardItem iconSrc="/sort-icon-white.svg"           text="Partial"           value={partialStudents} color="#FCB103" />
                  <DashboardItem iconSrc="/error-icon-white.svg"    text="Pending"           value={pendingStudents}  color="#808080" />
                </div>
              </div>
            )}

            {/* [SECTION] Section-level Forms (SF1, SF5) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-600)] mb-3 font-roboto">
                Section Forms
              </h4>

              {/* ── MOBILE: Form Cards ── */}
              <div className="flex flex-col gap-3 sm:hidden">
                {section.schoolForms.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50">
                    <p className="text-amber-600 font-medium text-sm font-roboto">⚠ No forms generated yet.</p>
                    <p className="text-xs text-amber-500 mt-1 font-roboto">Go back and generate forms for this section.</p>
                  </div>
                ) : (
                  section.schoolForms.map((form) => {
                    const notGenerated = !form.generatedAt;
                    const awaitingSubmit = form.generatedAt && !form.submittedAt;
                    return (
                      <div
                        key={form.id}
                        className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden"
                      >
                        {/* [CARD] Header */}
                        <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* [UI] Form type avatar */}
                            <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xs border border-[var(--color-primary-200)] flex-shrink-0">
                              {form.type}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-roboto font-bold text-[var(--color-text-900)] text-sm leading-tight truncate">
                                {FORM_TYPE_LABELS[form.type]}
                              </p>
                              <p className="text-xs text-[var(--color-text-500)] mt-0.5 truncate">
                                {FORM_TYPE_DESCRIPTIONS[form.type]}
                              </p>
                            </div>
                          </div>
                          {/* [BADGE] Form status */}
                          <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[form.status]}`}>
                            {FORM_STATUS_LABELS[form.status]}
                          </span>
                        </div>

                        {/* [CARD] Body */}
                        <div className="px-4 py-3 space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-700)] font-semibold">Generated</span>
                            <span className="text-[var(--color-text-900)]">{fmtDate(form.generatedAt)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-700)] font-semibold">Submitted</span>
                            <span className="text-[var(--color-text-900)]">{fmtDate(form.submittedAt)}</span>
                          </div>

                          {/* [BANNER] Status hints */}
                          {notGenerated && (
                            <div className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1 text-amber-700 font-roboto">
                              ⚠ Not yet generated
                            </div>
                          )}
                          {awaitingSubmit && (
                            <div className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 text-blue-700 font-roboto">
                              Awaiting submission
                            </div>
                          )}

                          {/* [BUTTON] Update Status */}
                          <button
                            onClick={(e) => handleStatusClick(form, e)}
                            className="text-xs text-[var(--color-primary-600)] hover:underline cursor-pointer font-roboto"
                          >
                            Update Status
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── DESKTOP: Forms Table ── */}
              <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden border border-[var(--color-bg-200)]">
                <table className="w-full text-sm font-roboto">
                  <thead>
                    <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide bg-[var(--color-bg-50)]">
                      <th className="px-4 py-3 text-left">Form</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Generated</th>
                      <th className="px-4 py-3 text-left">Submitted</th>
                      <th className="px-4 py-3 text-left">Approved</th>
                      <th className="px-4 py-3 text-left">Missing</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.schoolForms.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10">
                          <EmptyState
                            title="No forms generated"
                            subtitle="Go back and generate forms for this section."
                            iconSrc="/no-data-icon.svg"
                          />
                        </td>
                      </tr>
                    ) : (
                      section.schoolForms.map((form) => {
                        const formMissing: string[] = [];
                        if (!form.generatedAt)  formMissing.push("Not generated");
                        else if (!form.submittedAt) formMissing.push("Not submitted");
                        else if (!form.approvedAt)  formMissing.push("Not approved");
                        return (
                          <tr
                            key={form.id}
                            className={`border-b border-[var(--color-bg-200)] ${formMissing.length > 0 ? "bg-amber-50/30" : ""}`}
                          >
                            <td className="px-4 py-3 font-bold text-[var(--color-text-900)]">{form.type}</td>
                            <td className="px-4 py-3 text-[var(--color-text-600)] text-xs max-w-[200px]">{FORM_TYPE_DESCRIPTIONS[form.type]}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[form.status]}`}>
                                {FORM_STATUS_LABELS[form.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-[var(--color-text-500)]">{fmtDate(form.generatedAt)}</td>
                            <td className="px-4 py-3 text-xs text-[var(--color-text-500)]">{fmtDate(form.submittedAt)}</td>
                            <td className="px-4 py-3 text-xs text-[var(--color-text-500)]">{fmtDate(form.approvedAt)}</td>
                            <td className="px-4 py-3">
                              {formMissing.length > 0 ? (
                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                  <span>⚠</span> {formMissing.join(", ")}
                                </span>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">✓ Complete</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => handleStatusClick(form, e)}
                                className="text-xs text-[var(--color-primary-600)] hover:underline cursor-pointer"
                              >
                                Update Status
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* [SECTION] Per-Student Form Status */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-600)] font-roboto">
                  Students — Per-Student Form Status
                </h4>
                {/* [INPUT] Search */}
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                  className="bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-9 text-sm w-full sm:w-64"
                />
              </div>

              {/* ── MOBILE: Student Cards ── */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filteredStudents.length === 0 ? (
                  <EmptyState
                    title="No students found"
                    subtitle="No students match your search."
                    iconSrc="/no-data-icon.svg"
                  />
                ) : (
                  displayedStudents.map((student) => {
                    const missing = getStudentMissingFields(student);
                    return (
                      <div
                        key={student.id}
                        onClick={() => navigate(`/admin/school-forms/section/${section.id}/student/${student.id}`)}
                        className={`bg-white rounded-md border overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer ${
                          missing.length > 0 ? "border-amber-200" : "border-[var(--color-bg-200)]"
                        }`}
                      >
                        {/* [BANNER] Missing info warning */}
                        {missing.length > 0 && (
                          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center gap-1.5">
                            <img src="/error-icon.svg" className="size-6" />
                            <p className="text-xs text-amber-700 font-medium">Missing: {missing.join(" · ")}</p>
                          </div>
                        )}

                        {/* [CARD] Header */}
                        <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center gap-3 border-b border-[var(--color-bg-200)]">
                          {/* [UI] Initials avatar */}
                          <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border border-[var(--color-primary-200)] flex-shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-roboto font-bold text-[var(--color-text-900)] text-sm leading-tight truncate">
                              {fullName(student)}
                            </p>
                            <p className="text-xs font-mono text-[var(--color-text-500)] mt-0.5 tracking-wider">
                              LRN <span className="font-semibold text-[var(--color-text-700)]">{student.lrn}</span>
                            </p>
                          </div>
                          {/* [BADGE] Sex */}
                          <div className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                            student.sex === "MALE"
                              ? "bg-[var(--color-primary-100)] text-[var(--color-primary-500)]"
                              : "bg-[var(--color-red-100)] text-[var(--color-red-500)]"
                          }`}>
                            {student.sex === "MALE" ? "M" : "F"}
                          </div>
                        </div>

                        {/* [CARD] Body */}
                        <div className="px-4 py-3 space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-700)] font-semibold">Gen. Average</span>
                            <span className={student.generalAverage == null ? "text-amber-600 font-semibold" : "text-[var(--color-text-900)]"}>
                              {student.generalAverage ?? "—"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--color-text-700)] font-semibold">Action Taken</span>
                            <span className={!student.actionTaken ? "text-amber-600 font-semibold italic" : "text-[var(--color-text-900)]"}>
                              {student.actionTaken ?? "—"}
                            </span>
                          </div>

                          {/* [BADGES] Individual form statuses */}
                          <div className="flex gap-2 pt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STUDENT_STATUS_BADGE[student.sf9Status]}`}>
                              SF9: {STUDENT_FORM_LABELS[student.sf9Status]}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STUDENT_STATUS_BADGE[student.sf10Status]}`}>
                              SF10: {STUDENT_FORM_LABELS[student.sf10Status]}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STUDENT_STATUS_BADGE[student.sf5Status]}`}>
                              SF5: {STUDENT_FORM_LABELS[student.sf5Status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── DESKTOP: Students Table ── */}
              <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden border border-[var(--color-bg-200)]">
                <table className="w-full text-sm font-roboto">
                  <thead>
                    <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide bg-[var(--color-bg-50)]">
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">LRN</th>
                      <th className="px-4 py-3 text-left">Sex</th>
                      <th className="px-4 py-3 text-left">SF9</th>
                      <th className="px-4 py-3 text-left">SF10</th>
                      <th className="px-4 py-3 text-left">SF5</th>
                      <th className="px-4 py-3 text-left">Gen. Avg.</th>
                      <th className="px-4 py-3 text-left">Action Taken</th>
                      <th className="px-4 py-3 text-left">Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center">
                          <EmptyState
                            title="No students found"
                            subtitle="No students match your current search."
                            iconSrc="/no-data-icon.svg"
                          />
                        </td>
                      </tr>
                    ) : (
                      displayedStudents.map((student) => {
                        const missing = getStudentMissingFields(student);
                        return (
                          <tr
                            key={student.id}
                            onClick={() => navigate(`/admin/school-forms/section/${section.id}/student/${student.id}`)}
                            className={`border-b border-[var(--color-bg-200)] hover:bg-[var(--color-bg-50)] transition-colors cursor-pointer ${
                              missing.length > 0 ? "bg-amber-50/30" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-[var(--color-text-900)]">{fullName(student)}</td>
                            <td className="px-4 py-3 font-mono text-[var(--color-text-600)] text-xs">{student.lrn}</td>
                            <td className="px-4 py-3 text-[var(--color-text-700)]">{student.sex === "MALE" ? "M" : "F"}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STUDENT_STATUS_BADGE[student.sf9Status]}`}>
                                {STUDENT_FORM_LABELS[student.sf9Status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STUDENT_STATUS_BADGE[student.sf10Status]}`}>
                                {STUDENT_FORM_LABELS[student.sf10Status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STUDENT_STATUS_BADGE[student.sf5Status]}`}>
                                {STUDENT_FORM_LABELS[student.sf5Status]}
                              </span>
                            </td>
                            <td className={`px-4 py-3 ${student.generalAverage == null ? "text-amber-500 font-medium" : "text-[var(--color-text-700)]"}`}>
                              {student.generalAverage ?? "—"}
                            </td>
                            <td className={`px-4 py-3 ${!student.actionTaken ? "text-amber-500 font-medium" : "text-[var(--color-text-700)]"}`}>
                              {student.actionTaken ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {missing.length > 0 ? (
                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1" title={missing.join(", ")}>
                                  <span>⚠</span> {missing.length} field{missing.length > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">✓</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* [SECTION] Student Pagination */}
              {totalStudentPages > 1 && (
                <div className="flex justify-center items-center mt-4 gap-4">
                  <button
                    onClick={handleStudentPrevPage}
                    disabled={studentPage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
                      studentPage === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
                    }`}
                  >
                    &lt;
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setStudentPage(num)}
                        aria-label={`Go to page ${num}`}
                        className={`size-6 flex items-center justify-center rounded-full font-bold text-xs transition-all duration-150 ${
                          num === studentPage
                            ? "size-7 bg-[var(--color-primary-500)] text-[var(--color-text-50)] scale-110"
                            : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleStudentNextPage}
                    disabled={studentPage === totalStudentPages}
                    className={`size-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
                      studentPage === totalStudentPages ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
                    }`}
                  >
                    &gt;
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminSchoolFormDetails;