// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/Modal";
import MyClassCard from "../../components/MyClassCard";

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
  gradeLevel: string;
  name: string;
  classSize: number;
  maleCount: number;
  femaleCount: number;
  color: string;
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

  // *[HELPER] Handle API response with modal for errors
  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      setModalTitle("Unauthorized");
      setModalMessage("Your session has expired. Please login again.");
      setShowModal(true);
      return null;
    }
    return await res.json();
  };

  // *[EFFECT] Fetch section's students' grades
  useEffect(() => {
    const fetchGrades = async () => {
      if (!sectionId) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const resSection = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const sectionData = await handleApiResponse(resSection);

        // ![ERROR] Backend failure or missing data
        if (!sectionData?.success || !sectionData.data) {
          setModalTitle("Failed to fetch section");
          setModalMessage(sectionData?.message || "Unable to load section details.");
          setShowModal(true);
          setSection(null);
          setGrades([]);
          return;
        }

        const sec = sectionData.data;

        setSection({
          id: sec.id,
          gradeLevel: String(sec.gradeLevel),
          name: sec.name,
          classSize: sec.classSize ?? 0,
          maleCount: sec.maleCount ?? 0,
          femaleCount: sec.femaleCount ?? 0,
          color: sec.color ?? "#4F46E5",
        });
        
        const resGrades = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/section/${sectionId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const gradesData = await handleApiResponse(resGrades);

        // ![ERROR] Backend failure or missing data
        if (!gradesData?.success || !gradesData.data) {
          setModalTitle("Failed to fetch grades");
          setModalMessage(gradesData?.message || "Unable to load students' grades.");
          setShowModal(true);
          setGrades([]);
          return;
        }

        setGrades(gradesData.data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setModalTitle("Error");
        setModalMessage(errorMessage || "Something went wrong while fetching grades.");
        setShowModal(true);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchGrades();
  }, [sectionId, setShowTokenExpiredModal]);

  // [LOADING STATE] Wait for data fetch
  if (loading) return <p>Loading grades...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // Breadcrumbs navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section ? `${section.gradeLevel} — ${section.name}` : "Unknown Section", path: `/adviser/classes/${sectionId}` },
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
        />
      )}

      {/* [SECTION] Breadcrumbs Navigation */}
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            {crumb.path ? (
              <span
                className="cursor-pointer hover:underline"
                onClick={() => navigate(crumb.path!)}
              >
                {crumb.label}
              </span>
            ) : (
              <span className="font-roboto font-medium text-[var(--color-text-900)]">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      {/* [COMPONENT] My Class */}
      {section && (
        <MyClassCard
          id={section.id}
          key={section.id}
          name={section.name}
          classSize={section.classSize}
          maleCount={section.maleCount}
          femaleCount={section.femaleCount}
          color={section.color}
        />
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
                  onClick={() =>
                    navigate(`/adviser/classes/grades/${sectionId}/${student.id}`)
                  }
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