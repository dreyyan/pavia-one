/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import SchoolFormCard from "../../components/SchoolFormCard";

// Use lowercase for form types
type SchoolFormType = "sf1" | "sf2" | "sf5";

// ?[INTERFACE]
interface SchoolForm {
  id: number;
  type: SchoolFormType;
  schoolYear: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
  sectionId: number;
}

// Map form type to color
const formColors: Record<SchoolFormType, string> = {
  sf1: "#0066CC",
  sf2: "#CA8E02",
  sf5: "#28A428",
};

// Optional helper to handle API responses
const handleApiResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "API error");
  return data;
};

export const AdviserClassSchoolForms = () => {
  const [forms, setForms] = useState<SchoolForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized: token missing");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/forms`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await handleApiResponse(res);
        setForms(data.data || []); // assuming backend returns { data: [...] }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  return (
    <div className="py-6 px-4 space-y-4">
      {/* HEADER */}
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">School Forms</h1>
      </div>

      {/* LOADING / ERROR */}
      {loading && <p className="text-center">Loading forms...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {/* NO FORMS */}
      {!loading && !error && forms.length === 0 && (
        <p className="text-center text-gray-500">
          No school forms found for your advisory section.
        </p>
      )}

      {/* CARDS */}
      <div className="grid gap-4 px-2">
        {forms.map((form) => (
          <SchoolFormCard
            key={form.id}
            type={form.type}
            name={`SF${form.type.slice(2)} — ${form.type.toUpperCase()} Form`}
            schoolYear={form.schoolYear}
            color={formColors[form.type]}
            sectionId={form.sectionId}
          />
        ))}
      </div>
    </div>
  );
};

export default AdviserClassSchoolForms;