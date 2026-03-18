import { useState, useEffect } from "react";
import DashboardButton from "../../components/DashboardButton";
import DashboardSkeleton from "../../components/DashboardSkeleton";
import { useAuth } from "../../context/AuthContext";

const AdviserSchoolRegistersForms = () => {
  const { setShowTokenExpiredModal } = useAuth();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [sectionId, setSectionId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setShowTokenExpiredModal(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data = await res.json();

        if (data.success) {
          const advisory = data.data.sections.find(s => s.isAdvisory);
          if (advisory) setSectionId(advisory.id);
        }
      } catch {
        setError("Failed to load adviser profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setShowTokenExpiredModal]);

  const handleGenerateSF1 = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setShowTokenExpiredModal(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1?sectionId=${sectionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // --- Convert response to Blob ---
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // --- Trigger download ---
      const a = document.createElement("a");
      a.href = url;
      a.download = `SF1_Section_${sectionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching SF1");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="py-6 px-4 space-y-4">
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">
          School Registers & Forms
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6 px-4">
        <button
          onClick={handleGenerateSF1}
          className="bg-[var(--color-primary-700)] text-[var(--color-text-50)]"
        >
          Generate SF1
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {students.length > 0 && (
        <div className="mt-4">
          <h2 className="font-bold">Students Preview:</h2>
          <ul className="list-disc pl-6">
            {students.slice(0, 10).map((s, i) => (
              <li key={i}>
                {s["LRN"]} - {s["Last Name"]}, {s["First Name"]}{" "}
                {s["Middle Name"]}
              </li>
            ))}
          </ul>
          {students.length > 10 && (
            <p>...and {students.length - 10} more students</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdviserSchoolRegistersForms;