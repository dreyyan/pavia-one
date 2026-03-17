import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";

interface Student {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  email?: string;
  sex?: string;
  birthDate?: string;
  profilePic?: string;
  sectionId?: number;
}

const AdviserStudentDetails = () => {
  const { id: sectionId, studentId } = useParams<{ id: string; studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: [HANDLE] Generate SF9
  const handleGenerateSF9 = () => {
      
  };

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Failed to fetch student data");
          setStudent(null);
        } else {
          setStudent(data.data);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId && studentId) fetchStudent();
  }, [sectionId, studentId]);

  if (loading) return <p>Loading student details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!student) return <p>Student not found.</p>;

  return (
    <div className="py-8 px-4 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/adviser/classes/${sectionId}/students`)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] 
                   text-[var(--color-text-50)] font-semibold rounded-full shadow-lg hover:bg-[var(--color-primary-500)] 
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Students
      </button>

      {/* Student Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center">
        <img
          src={student.profilePic}
          className="size-24 rounded-full object-cover bg-[var(--color-bg-400)]"
        />

        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-text-900)]">{student.fullName}</h2>
          <p>
            <span className="font-semibold">LRN:</span> {student.lrn}
          </p>
          {student.email && (
            <p>
              <span className="font-semibold">Email:</span> {student.email}
            </p>
          )}
          {student.sex && (
            <p>
              <span className="font-semibold">Sex:</span> {student.sex}
            </p>
          )}
          {student.birthDate && (
            <p>
              <span className="font-semibold">Birth Date:</span>{" "}
              {new Date(student.birthDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* [PRIMARY BUTTON] Generate SF9 */}
      <PrimaryButton text="Generate SF9" onClick={handleGenerateSF9} />

      {/* [SECTION] Student Information */}
      <div className="py-6">
          <h3>Basic Information</h3>
            <InputField
                label="LRN"
                type="Last Name"
                value={""}
                onChange={(e) => {}}
                disabled={true}
            />
      </div>
    </div>
  );
};

export default AdviserStudentDetails;