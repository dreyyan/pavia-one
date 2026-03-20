import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { createPortal } from "react-dom";

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

const AdviserClassStudentGradesOverview = () => {
  const { sectionId, studentId } = useParams<{ sectionId: string; studentId: string }>();
  const navigate = useNavigate();

  const [grades, setGrades] = useState<StudentGradeDetail[]>([]);
  const [profileName, setProfileName] = useState<string>("Unknown Name");
  const [advisorySection, setAdvisorySection] = useState<{ gradeLevel: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [hoveredGradeId, setHoveredGradeId] = useState<number | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const finalRatingRefs = useRef<Record<number, HTMLTableCellElement>>({});

  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      setModalTitle("Unauthorized");
      setModalMessage("Your session has expired. Please login again.");
      setShowModal(true);
      return null;
    }
    return await res.json();
  };

  useEffect(() => {
    const fetchStudentAndGrades = async () => {
      if (!sectionId || !studentId) return;
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        // Fetch student info
        const studentRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
        const studentData = await handleApiResponse(studentRes);

        if (studentData?.success) {
          setProfileName(studentData.data.fullName ?? "Unknown Name");
          setAdvisorySection({
            gradeLevel: String(studentData.data.gradeLevel),
            name: studentData.data.sectionName,
          });
        } else {
          setProfileName("Unknown Name");
          setAdvisorySection(null);
        }

        // Fetch SF9 grades
        const gradesRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/${studentId}`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
        const gradesData = await handleApiResponse(gradesRes);

        if (!gradesData?.success || !gradesData.data) {
          setError(gradesData?.message || "Failed to fetch grades");
          setGrades([]);
          return;
        }

        setGrades(
          gradesData.data.map((g: any) => ({
            id: g.id,
            subject: SUBJECT_ABBREVIATIONS[g.learningArea?.name] ?? g.learningArea?.name ?? "Unknown",
            q1: g.q1,
            q2: g.q2,
            q3: g.q3,
            q4: g.q4,
            finalRating: g.finalRating,
            remarks: g.remarks,
          }))
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || "Something went wrong while fetching data");
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndGrades();
  }, [sectionId, studentId]);

  if (loading) return <p>Loading student grades...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!grades || grades.length === 0)
    return <p className="text-center text-[var(--color-text-700)] py-4">No grades available for this student.</p>;

  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: advisorySection ? `${advisorySection.gradeLevel} — ${advisorySection.name}` : "Unknown Section", path: `/adviser/classes/${sectionId}` },
    { label: "Grades", path: `/adviser/classes/grades/${sectionId}` },
    { label: profileName, path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-4 max-w-4xl mx-auto">
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            {crumb.path ? (
              <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>{crumb.label}</span>
            ) : (
              <span className="font-roboto font-medium text-[var(--color-text-900)]">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => setShowModal(false)}
          title={modalTitle}
          message={modalMessage}
        />
      )}

      <div className="flex items-center bg-[var(--color-primary-600)] border-3 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md">
        <div className="bg-[var(--color-bg-200)] w-18 h-18 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">{profileName}</p>
          {advisorySection ? (
            <>
              <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">Grade {advisorySection.gradeLevel} — {advisorySection.name}</p>
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">Student</p>
            </>
          ) : (
            <p className="text-red-600 font-semibold text-sm">You are not assigned to any advisory section.</p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-[var(--color-bg-50)] shadow-md rounded-lg">
        <table className="min-w-full bg-white shadow-md table-auto border-collapse">
          <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
            <tr>
              <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] w-40 truncate">Subject</th>
              <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] hidden sm:table-cell">Q1</th>
              <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] hidden sm:table-cell">Q2</th>
              <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] hidden sm:table-cell">Q3</th>
              <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] hidden sm:table-cell">Q4</th>
              <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)]">Final Rating</th>
              <th className="py-2 px-4 text-left font-bold">Remarks</th>
            </tr>
          </thead>

          <tbody className="font-roboto">
            {grades.map((grade) => (
              <tr
                key={grade.id}
                className="border-t border-[var(--color-bg-100)] hover:bg-[var(--color-bg-50)] transition-colors duration-200 ease-in-out"
              >
                {/* Subject */}
                <td className="py-2 px-4 text-sm border-r border-[var(--color-bg-300)] w-40">
                  <span
                    className="cursor-pointer text-[var(--color-primary-700)] hover:underline truncate block"
                    onClick={() => navigate(`/adviser/classes/grades/${sectionId}/${studentId}/subjects/${grade.id}`)}
                  >
                    {grade.subject}
                  </span>
                </td>

                <td className="py-2 px-4 text-sm border-r border-[var(--color-bg-300)] hidden sm:table-cell">{grade.q1 ?? "—"}</td>
                <td className="py-2 px-4 text-sm border-r border-[var(--color-bg-300)] hidden sm:table-cell">{grade.q2 ?? "—"}</td>
                <td className="py-2 px-4 text-sm border-r border-[var(--color-bg-300)] hidden sm:table-cell">{grade.q3 ?? "—"}</td>
                <td className="py-2 px-4 text-sm border-r border-[var(--color-bg-300)] hidden sm:table-cell">{grade.q4 ?? "—"}</td>

                {/* Final Rating with bubble */}
                <td
                  className="py-2 px-4 text-sm border-r border-[var(--color-bg-300)] relative cursor-default"
                  ref={(el) => { if (el) finalRatingRefs.current[grade.id] = el }}
                  onMouseEnter={() => {
                    setHoveredGradeId(grade.id);
                    const rect = finalRatingRefs.current[grade.id]?.getBoundingClientRect();
                    if (rect) {
                      setBubblePos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredGradeId(null);
                    setBubblePos(null);
                  }}
                >
                  {grade.finalRating ?? "—"}

                  {hoveredGradeId === grade.id && bubblePos &&
                    createPortal(
                      <div
                        className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs whitespace-nowrap"
                        style={{
                          top: bubblePos.top,
                          left: bubblePos.left,
                          transform: "translateX(-50%)",
                          pointerEvents: "none",
                        }}
                      >
                        {[["Q1", grade.q1], ["Q2", grade.q2], ["Q3", grade.q3], ["Q4", grade.q4]].map(([label, val]) => (
                          <div key={label} className="flex justify-between gap-4 py-0.5">
                            <span className="text-gray-500 font-medium">{label}</span>
                            <span className="font-medium text-gray-800">{val ?? "—"}</span>
                          </div>
                        ))}
                      </div>,
                      document.body
                    )}
                </td>

                <td className="py-2 px-4 text-sm">{grade.remarks ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdviserClassStudentGradesOverview;