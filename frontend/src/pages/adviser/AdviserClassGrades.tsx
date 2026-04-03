// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/Modal";
import ClassCard from "../../components/ClassCard";

// ?[INTERFACES]
interface StudentGrade {
  id: number;
  lrn: string;
  fullName: string;
  average: number | null;
  remarks: string | null;
}

interface SectionInfo {
  id: number;
  name: string;
  gradeLevel: string;
  classSize: number;
  maleCount: number;
  femaleCount: number;
  color: string;
}

interface Enrollment {
  student?: { sex?: "MALE" | "FEMALE" | null } | null;
}

const AdviserClassGrades = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);

  // *[EFFECT] Fetch section info and students' grades
  useEffect(() => {
    const fetchGrades = async () => {
      if (!sectionId) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        // --- Fetch section info ---
        const resSection = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );

        if (resSection.status === 401) {
          setShowTokenExpiredModal(true);
          setLoading(false);
          return;
        }

        const sectionData = await resSection.json();

        if (!sectionData?.success || !sectionData.data) {
          setModalTitle("Unable to open class section");
          setModalMessage(
            "We couldn’t load the details of this class section right now. Please check your internet connection and try again. If the problem continues, contact the school administrator."
          );
          setIsCancelable(false);
          setShowModal(true);
          setSection(null);
          setGrades([]);
          return;
        }

        const sec = sectionData.data;

        // --- Safe male/female count ---
        let maleCount = 0;
        let femaleCount = 0;

        (sec.enrollments || []).forEach((enroll: Enrollment) => {
          const sex = enroll.student?.sex;
          if (sex === "MALE") maleCount++;
          else if (sex === "FEMALE") femaleCount++;
        });

        const totalClassSize = sec.classSize ?? maleCount + femaleCount;

        setSection({
          id: sec.id,
          gradeLevel: String(sec.gradeLevel),
          name: `${sec.gradeLevel} — ${sec.name}`,
          classSize: totalClassSize,
          maleCount,
          femaleCount,
          color: sec.color ?? "#999999",
        });

        // --- Fetch students' grades ---
        const resGrades = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/section/${sectionId}`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );

        const gradesData = await resGrades.json();

        if (!gradesData?.success || !gradesData.data) {
          setModalTitle("Unable to load grades");
          setModalMessage(
            "We couldn’t load the students’ grades right now. Please check your internet connection and try again. If the problem continues, contact the school administrator."
          );
          setIsCancelable(false);
          setShowModal(true);
          setGrades([]);
          return;
        }

        setGrades(gradesData.data);
      } catch (err: unknown) {
        console.error(err);
        setModalTitle("Unable to load grades");
        setModalMessage(
          "We couldn’t load the students’ grades right now. Please check your internet connection and try again. If the problem continues, contact the school administrator."
        );
        setIsCancelable(false);
        setShowModal(true);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [sectionId, setShowTokenExpiredModal]);

  // [LOADING STATE] Wait for data fetch
  if (loading) return <p>Loading grades...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // [BREADCRUMBS]
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section?.name || "Class", path: `/adviser/classes/${sectionId}` },
    { label: "Grades", path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-4">
      {/* [COMPONENT] Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          message={modalMessage}
          onConfirm={() => setShowModal(false)}
          isCancelable={isCancelable}
        />
      )}
    {/* [SECTION] Header & Breadcrumbs */}
    <div>
      <h2 className="text-[var(--color-text-800)] leading-0">Grades</h2>
      <nav className="font-roboto text-sm text-[var(--color-text-700)]">
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
    </div>

      {/* [COMPONENT] My Class */}
      {section && (
        <div className="">
          <ClassCard
            id={section.id}
            key={section.id}
            name={section.name}
            classSize={section.classSize}
            maleCount={section.maleCount}
            femaleCount={section.femaleCount}
            color={section.color}
          />
        </div>
      )}

      {/* [SECTION] Grades Table */}
      <div className="overflow-x-auto bg-[var(--color-bg-50)] shadow-md rounded-lg">
        {grades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-center text-[var(--color-text-800)]">
            <img src="/no-data-icon.svg" alt="No grades" className="size-16" />
            <p className="font-roboto font-semibold text-lg">No grades available</p>
            <p className="font-roboto text-sm text-[var(--color-text-700)]">
              Grades will appear here once uploaded.
            </p>
          </div>
        ) : (
          <table className="min-w-full bg-white shadow-md table-auto border-collapse">
            <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
              <tr>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] w-28 truncate">
                  LRN
                </th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] hidden sm:table-cell">
                  Full Name
                </th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)]">
                  Average (Current)
                </th>
                <th className="py-2 px-4 text-left font-bold">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="font-roboto">
              {grades.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-[var(--color-bg-100)] hover:bg-[var(--color-bg-50)] transition-color duration-200 ease-in-out cursor-pointer"
                  onClick={() => navigate(`/adviser/classes/grades/${sectionId}/${student.id}`)}
                >
                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] w-28 truncate">
                    {student.lrn}
                  </td>

                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] font-bold border-r border-[var(--color-bg-300)] truncate max-w-[150px] hidden sm:table-cell">
                    {student.fullName}
                  </td>

                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)]">
                    {student.average ?? "-"}
                  </td>

                  <td className="text-sm py-2 px-4 text-[var(--color-text-900)]">
                    {student.remarks ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdviserClassGrades;