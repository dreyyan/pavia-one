import SchoolFormCard from "../../components/SchoolFormCard";

// Use lowercase for form types
type SchoolFormType = "sf1" | "sf2" | "sf5";

// ?[INTERFACE]
interface SchoolForm {
  id: number;
  name: string;
  type: SchoolFormType;
  schoolYear: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
}

// Map form type to color
const formColors: Record<SchoolFormType, string> = {
  sf1: "#0066CC",
  sf2: "#CA8E02",
  sf5: "#28A428",
};

export const AdviserClassSchoolForms = () => {
  const mockForms: SchoolForm[] = [
    { id: 1, name: "SF1 — School Register", type: "sf1", schoolYear: "2026-2027", status: "DRAFT" },
    { id: 2, name: "SF2 — Daily Attendance", type: "sf2", schoolYear: "2026-2027", status: "SUBMITTED" },
    { id: 5, name: "SF5 — Promotion & Completion", type: "sf5", schoolYear: "2026-2027", status: "APPROVED" },
  ];

  return (
    <div className="py-6 px-4 space-y-4">
      {/* HEADER */}
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">
          School Forms
        </h1>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 px-2">
        {mockForms.map((form) => (
          <SchoolFormCard
            key={form.id}
            type={form.type}
            name={form.name}
            schoolYear={form.schoolYear}
            color={formColors[form.type]}
            sectionId={form.id}
          />
        ))}
      </div>
    </div>
  );
};

export default AdviserClassSchoolForms;