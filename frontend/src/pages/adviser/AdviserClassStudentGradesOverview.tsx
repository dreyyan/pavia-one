/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import ProfileInfo from "../../components/ProfileInfo";
import Breadcrumbs from "../../components/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// ? [INTERFACE] SF9 grade from API
interface ApiSF9Grade {
  id: number;
  learningArea?: { name: string } | null;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  finalRating: number | null;
  remarks: string | null;
}

// ? [INTERFACE] Flattened grade for the table
interface StudentGradeDetail {
  id: number;
  subject: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  finalRating: number | null;
  remarks: string | null;
}

// ? [INTERFACE] Advisory section summary
interface AdvisorySection {
  gradeLevel: string;
  name: string;
}

// [CONSTANT] Subject display abbreviations
const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  "Filipino": "FIL",
  "English": "ENG",
  "Mathematics": "MATH",
  "Science": "SCI",
  "Araling Panlipunan": "AP",
  "Edukasyon sa Pagpapakatao": "ESP",
  "MAPEH": "MAPEH",
  "Edukasyong Pantahanan at Pangkabuhayan": "EPP/TLE",
};

// [HELPER] Map a final grade average to an honor award label
const getAward = (avg: number): string => {
  if (avg >= 98) return "With Highest Honors";
  if (avg >= 95) return "With High Honors";
  if (avg >= 90) return "With Honors";
  return "";
};

// [HELPER] Calculate award only when all grades are complete
const calculateAward = (grades: StudentGradeDetail[]): string | null => {
  const complete = grades.filter(
    g => g.q1 !== null && g.q2 !== null && g.q3 !== null && g.q4 !== null
  );
  if (complete.length !== grades.length || grades.length === 0) return null;
  const avg = complete.reduce((sum, g) => sum + (g.finalRating ?? 0), 0) / complete.length;
  return getAward(avg) || null;
};

const AdviserClassStudentGradesOverview = () => {
  const { sectionId, studentId } = useParams<{ sectionId: string; studentId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [grades, setGrades] = useState<StudentGradeDetail[]>([]);
  const [profileName, setProfileName] = useState("");
  const [advisorySection, setAdvisorySection] = useState<AdvisorySection | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Final rating hover tooltip
  const [hoveredGradeId, setHoveredGradeId] = useState<number | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const finalRatingRefs = useRef<Record<number, HTMLTableCellElement>>({});

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: false,
    onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // * [HANDLE] Fetch Student Profile and SF9 Grades
  const fetchStudentAndGrades = async () => {
    if (!sectionId || !studentId) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data: {
        success: boolean;
        data: {
          fullName?: string;
          gradeLevel?: string | number;
          sectionName?: string;
          sf9Grades?: ApiSF9Grade[];
        };
      } = await res.json();

      if (!data.success) throw new Error("Failed to fetch student data");

      setProfileName(data.data.fullName ?? "");
      setAdvisorySection(
        data.data.gradeLevel && data.data.sectionName
          ? { gradeLevel: String(data.data.gradeLevel), name: data.data.sectionName }
          : null
      );

      const gradesArray: ApiSF9Grade[] = Array.isArray(data.data.sf9Grades)
        ? data.data.sf9Grades
        : [];

      setGrades(
        gradesArray.map(g => ({
          id: g.id,
          subject: g.learningArea?.name
            ? (SUBJECT_ABBREVIATIONS[g.learningArea.name] ?? g.learningArea.name)
            : "Unknown",
          q1: g.q1 ?? null,
          q2: g.q2 ?? null,
          q3: g.q3 ?? null,
          q4: g.q4 ?? null,
          finalRating: g.finalRating ?? null,
          remarks: g.remarks ?? null,
        }))
      );
    } catch (err) {
      // ! [ERROR] Fetching grades failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Grades",
        message: "We couldn't load this student's grades. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentAndGrades();
  }, [sectionId, studentId]);

  // * [BREADCRUMBS] Adviser Student Grades Overview navigation
  const breadcrumbs = [
    { label: "Adviser Dashboard", path: "/adviser/dashboard" },
    { label: "Class Management", path: "/adviser/classes" },
    {
      label: advisorySection
        ? `${advisorySection.gradeLevel} — ${advisorySection.name}`
        : "Section",
      path: `/adviser/classes/${sectionId}`,
    },
    { label: "Grades", path: `/adviser/classes/${sectionId}/grades` },
    { label: profileName || "Student", path: null },
  ];

  const award = calculateAward(grades);

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  // [COMPUTE] Split name for ProfileInfo
  const nameParts = profileName.trim().split(" ");
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ") || firstName;

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

      {/* [LAYOUT] Adviser Page */}
      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="Student Grades" />}
      >
        <div className="space-y-4">

          {/* [COMPONENT] Profile Info */}
          <ProfileInfo lastName={lastName} firstName={firstName} />

          {/* [CARD] Advisory Section */}
          {advisorySection && (
            <div className="bg-[var(--color-bg-100)] rounded-lg px-4 py-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
                Section
              </p>
              <p className="font-roboto font-semibold text-[var(--color-text-900)]">
                Grade {advisorySection.gradeLevel} — {advisorySection.name}
              </p>
            </div>
          )}

          {/* [SECTION] Grades Table / Mobile Cards */}
          <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">

            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-3">
              SF9 Grades
            </p>

            {grades.length === 0 ? (
              <p className="text-sm font-roboto text-[var(--color-text-600)] py-4 text-center">
                No grades available for this student.
              </p>
            ) : (
              <>
                {/* ===================== DESKTOP TABLE ===================== */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left">
                        <th className="table-header">Subject</th>
                        <th className="table-header">Q1</th>
                        <th className="table-header">Q2</th>
                        <th className="table-header">Q3</th>
                        <th className="table-header">Q4</th>
                        <th className="table-header">Final Rating</th>
                        <th className="table-header">Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {grades.map((grade) => (
                        <tr
                          key={grade.id}
                          className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition"
                        >
                          <td className="table-cell table-text">
                            <span
                              className="table-text-link hover:underline cursor-pointer"
                              onClick={() =>
                                navigate(
                                  `/adviser/classes/${sectionId}/grades/${studentId}/subjects/${grade.id}`
                                )
                              }
                            >
                              {grade.subject}
                            </span>
                          </td>

                          <td className="table-cell table-text-default">{grade.q1 ?? "—"}</td>
                          <td className="table-cell table-text-default">{grade.q2 ?? "—"}</td>
                          <td className="table-cell table-text-default">{grade.q3 ?? "—"}</td>
                          <td className="table-cell table-text-default">{grade.q4 ?? "—"}</td>

                          <td className="table-cell table-text-default">
                            {grade.finalRating ?? "—"}
                          </td>

                          <td className="table-cell table-text-default">
                            {grade.remarks ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ===================== MOBILE CARDS ===================== */}
                <div className="md:hidden space-y-3">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-lg p-3 shadow-sm active:scale-[0.99] transition"
                      onClick={() =>
                        navigate(
                          `/adviser/classes/${sectionId}/grades/${studentId}/subjects/${grade.id}`
                        )
                      }
                    >
                      {/* Subject */}
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-[var(--color-text-900)]">
                          {grade.subject}
                        </p>
                      </div>

                      {/* Quarter Grid */}
                      <div className="grid grid-cols-4 gap-2 text-xs text-center mb-2">
                        <div>
                          <p className="text-[var(--color-text-500)]">Q1</p>
                          <p>{grade.q1 ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-[var(--color-text-500)]">Q2</p>
                          <p>{grade.q2 ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-[var(--color-text-500)]">Q3</p>
                          <p>{grade.q3 ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-[var(--color-text-500)]">Q4</p>
                          <p>{grade.q4 ?? "—"}</p>
                        </div>
                      </div>

                      {/* Final + Remarks */}
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          Final: {grade.finalRating ?? "—"}
                        </span>
                        <span className="text-[var(--color-text-600)]">
                          {grade.remarks ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* [CARD] Honor Award — shown only when all grades are complete */}
          {award && (
            <div className="bg-[var(--color-accent-50)] border border-[var(--color-accent-300)] rounded-lg px-4 py-3 text-center">
              <p className="font-roboto font-semibold text-[var(--color-accent-800)]">
                🏅 {award}
              </p>
            </div>
          )}

        </div>
      </PageLayout>
    </>
  );
};

export default AdviserClassStudentGradesOverview;