// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// [IMPORT] Components
import ClassCard from "../../components/cards/ClassCard";
import DashboardButton from "../../components/buttons/DashboardButton";

// ?[INTERFACES]
interface ScheduleItem {
  day: string;
  time: string;
}

interface Enrollment {
  student?: { sex?: "MALE" | "FEMALE" } | null;
}

interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  color: string;
  classSize: number;
  schedule: ScheduleItem[];
  maleCount?: number;
  femaleCount?: number;
}

const AdviserClassDetails = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  // [STATES]
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // *[EFFECT] Fetch adviser's class's details
  useEffect(() => {
    const fetchSection = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        // ![ERROR] Backend failure response
        if (!data.success) {
          setError(data.message || "Failed to fetch section");
          setSection(null);
        } else {
          const sec = data.data;

          let maleCount = 0;
          let femaleCount = 0;
          (sec.enrollments || []).forEach((enroll: Enrollment) => {
            const sex = enroll.student?.sex;
            if (sex === "MALE") maleCount++;
            else if (sex === "FEMALE") femaleCount++;
          });

          setSection({
            id: sec.id,
            name: `${sec.gradeLevel} — ${sec.name}`,
            gradeLevel: sec.gradeLevel,
            schoolYear: sec.schoolYear,
            color: sec.color || "#999999",
            classSize: sec.classSize || 0,
            schedule: sec.schedule || [],
            maleCount,
            femaleCount,
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Something went wrong");
        setSection(null);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchSection();
  }, [sectionId]);

  // [LOADING STATE] Wait for class fetch
  if (loading) return <p>Loading class...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!section) return <p>No section found.</p>;

  // [BREADCRUMBS]
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: section.name, path: null }
  ];

  return (
    <div className="py-10 px-4 space-y-4">
    {/* [SECTION] Header & Breadcrumbs */}
    <div>
      <h2 className="text-[var(--color-text-800)] leading-0">Section Details</h2>
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
      <div className="">
        <ClassCard
          id={section.id}
          key={section.id}
          name={section.name}
          classSize={section.classSize}
          maleCount={section.maleCount ?? 0}
          femaleCount={section.femaleCount ?? 0}
          color={section.color}
        />
      </div>

      {/* [SECTION] Class Overview */}
      <div className="bg-[var(--color-bg-100)] rounded-xl px-4 py-4 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
      </div>

      {/* [SECTION] Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-6 px-4">
        <DashboardButton
          iconSrc="/view-students-dashboard.svg"
          text="View Students"
          color="#0066CC"
          to={`/adviser/classes/${sectionId}/students`}
        />
        <DashboardButton
          iconSrc="/grades-dashboard.svg"
          text="Grades"
          color="#CA8E02"
          to={`/adviser/classes/${sectionId}/grades`}
        />
        {/* <DashboardButton
          iconSrc="/reports-dashboard.svg"
          text="Reports"
          color="#8F28A4"
        /> */}
      </div>
    </div>
  );
};

export default AdviserClassDetails;