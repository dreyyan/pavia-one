// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";

// ? [INTERFACES]
interface StudentData {
  LRN: string;
  "First Name": string;
  "Middle Name": string;
  "Last Name": string;
  Sex: string;
  Age: number | string;
  "Mother Tongue": string;
  Religion: string;
  "Father Name": string;
  "Mother Maiden Name": string;
  Barangay: string;
  Municipality: string;
  Province: string;
  "Learning Modality": string;
  Remarks: string;
}

const SF1View = () => {
  // [STATES]
  const { setShowTokenExpiredModal } = useAuth();
  const { sectionId } = useParams<{ sectionId: string }>();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  // *[EFFECT] Fetch SF1 data for section
  useEffect(() => {
    const fetchSF1Data = async () => {
      try {
        const token = localStorage.getItem("token");

        // ![ERROR] Missing token
        if (!token) {
          setShowTokenExpiredModal(true);
          setLoading(false);
          return;
        }

        if (!sectionId) throw new Error("Missing sectionId");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/${sectionId}/sf1/view`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // ![ERROR] Expired or invalid token
        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        // ![ERROR] Backend failure response
        if (!data.success) {
          console.error("SF1 fetch error:", data.message);
          alert(data.message || "Failed to load SF1 data");
          return;
        }

        // *[SUCCESS] Set students data
        setStudents(data.students || []);
      } catch (err) {
        console.error("Failed to fetch SF1 data:", err);
        alert("Failed to load SF1 data");
      } finally {
        setLoading(false);
      }
    };

    fetchSF1Data();
  }, [sectionId, setShowTokenExpiredModal]);

  // [LOADING STATE]
  if (loading) return <p>Loading SF1 data...</p>;

  // [ERROR/EMPTY STATE]
  if (!students.length)
    return (
      <p className="text-center text-gray-500 py-4">
        No student data available for this section.
      </p>
    );

  const headers = Object.keys(students[0]);

  return (
    <div className="py-6 px-4 space-y-4">
      {/* [UI] Page Title */}
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">
          SF1 - Section View
        </h1>
      </div>

      {/* [UI] Placeholder for mobile */}
      <div className="md:hidden font-roboto text-sm p-4 bg-[var(--color-bg-50)] shadow-md rounded-lg text-center text-[var(--color-text-700)]">
        SF1 view is only available on larger screens. Please switch to a tablet
        or desktop to view the full table.
      </div>

      {/* [TABLE] Visible only on md and up */}
      <div className="overflow-auto hidden md:block">
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="border border-gray-300 px-2 py-1 bg-gray-100 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {headers.map((header) => (
                  <td key={header} className="border border-gray-300 px-2 py-1">
                    {student[header as keyof StudentData]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SF1View;