import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import SchoolFormCard from "../../components/SchoolFormCard";

const AdviserClassSchoolForms = () => {
  // [STATES]
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [sectionId, setSectionId] = useState(null);

  const mockForms = [
    {
      id: 1,
      name: "SF1 — School Register",
      schoolYear: "2025-2026",
      totalMale: 18,
      totalFemale: 20,
      color: "#2563EB",
    },
    {
      id: 2,
      name: "SF2 — Daily Attendance",
      schoolYear: "2025-2026",
      totalMale: 18,
      totalFemale: 20,
      color: "#059669",
    },
    {
      id: 5,
      name: "SF5 — Promotion & Completion",
      schoolYear: "2025-2026",
      totalMale: 18,
      totalFemale: 20,
      color: "#D97706",
    },
    {
      id: 10,
      name: "SF10 — Report Card",
      schoolYear: "2025-2026",
      totalMale: 18,
      totalFemale: 20,
      color: "#7C3AED",
    },
  ];

  return (
    <div className="py-6 px-4 space-y-4">
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">
          School Forms
        </h1>
      </div>

      <div className="grid gap-4 px-2">
        {mockForms.map((form) => (
          <SchoolFormCard
            key={form.id}
            id={form.id}
            name={form.name}
            schoolYear={form.schoolYear}
            totalMale={form.totalMale}
            totalFemale={form.totalFemale}
            color={form.color}
          />
        ))}
      </div>
    </div>
  );
};

export default AdviserClassSchoolForms;