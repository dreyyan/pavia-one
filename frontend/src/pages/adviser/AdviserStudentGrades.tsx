import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Modal from "../../components/Modal";

interface StudentGrade {
  id: number;
  lrn: string;
  average?: number;
  remarks?: string;
}

const AdviserStudentGrades = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

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
    const fetchGrades = async () => {
      if (!sectionId) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/${sectionId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await handleApiResponse(res);
        if (!data) return;

        if (!data.success || !data.data) {
          setError(data.message || "Failed to fetch grades");
          setGrades([]);
          return;
        }

        setGrades(data.data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [sectionId]);

  if (loading) return <p>Loading grades...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="py-8 px-4 space-y-4">
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          message={modalMessage}
          onConfirm={() => setShowModal(false)}
        />
      )}

      <h2 className="font-semibold text-xl text-[var(--color-text-900)]">
        Student Grades
      </h2>

      <div className="overflow-x-auto bg-[var(--color-bg-50)] shadow-md rounded-lg">
        <table className="min-w-full table-auto font-roboto text-[var(--color-text-900)]">
          <thead>
            <tr className="bg-[var(--color-bg-100)] border-b border-[var(--color-bg-200)]">
              <th className="py-2 px-4 text-left font-semibold text-sm">LRN</th>
              <th className="py-2 px-4 text-left font-semibold text-sm">Average (Current)</th>
              <th className="py-2 px-4 text-left font-semibold text-sm">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  No grades available.
                </td>
              </tr>
            ) : (
              grades.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-[var(--color-bg-200)] hover:bg-[var(--color-bg-100)]"
                >
                  <td className="py-2 px-4 text-sm">{student.lrn}</td>
                  <td className="py-2 px-4 text-sm">{student.average ?? "-"}</td>
                  <td className="py-2 px-4 text-sm">{student.remarks ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdviserStudentGrades;