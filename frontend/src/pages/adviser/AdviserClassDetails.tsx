// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// [IMPORT] Components
import MyClassCard from "../../components/MyClassCard";
import DashboardButton from "../../components/DashboardButton";
import ClassSummaryItem from "../../components/ClassSummaryItem";

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

interface Profile {
  attendanceRate: number;
  classAverage: number;
  studentsAtRisk: number;
};

const AdviserClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // [STATES]
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile] = useState<Profile | null>(null);

  // *[EFFECT] Fetch adviser's class's details
  useEffect(() => {
    const fetchSection = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        console.log("Section fetch response:", data);

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

    if (id) fetchSection();
  }, [id]);

  // [LOADING STATE] Wait for class fetch
  if (loading) return <p>Loading class...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!section) return <p>No section found.</p>;

  // Breadcrumbs navigation
  const breadcrumbs = [
    {
      label: "Class Management",
      path: "/adviser/classes",
    },
    {
      label: section.name,
      path: null,
    },
  ];

  return (
    <div className="py-10 px-4 space-y-4 relative">
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
              <span className="font-roboto font-medium text-[var(--color-text-900)]">
                {crumb.label}
              </span>
            )}

            {index < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      {/* [COMPONENT] My Class */}
      <MyClassCard
        id={section.id}
        key={section.id}
        name={section.name}
        schedule={section.schedule}
        classSize={section.classSize}
        maleCount={section.maleCount ?? 0}
        femaleCount={section.femaleCount ?? 0}
        color={section.color}
      />

      {/* [SECTION] Class Overview */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-2xl px-4 py-4 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
        <div className="flex flex-col gap-y-2">
          <ClassSummaryItem iconSrc="/attendance-icon.svg" text="Attendance Rate" value={profile?.attendanceRate || 0} />
          <ClassSummaryItem iconSrc="/class-average-icon.svg" text="Class Average" value={profile?.classAverage || 0} />
          <ClassSummaryItem iconSrc="/students-at-risk-icon.svg" text="Students at Risk" value={profile?.studentsAtRisk || 0} />
        </div>
      </div>

      {/* [SECTION] Dashboard Buttons */}
      <div className="grid grid-cols-2 gap-6 px-4">
        <DashboardButton iconSrc="/view-students-icon.svg" text="View Students" color="#0066CC" to={`/adviser/classes/${id}/students`} />
        <DashboardButton iconSrc="/attendance-icon.svg" text="Attendance" color="#28A428" />
        <DashboardButton
          iconSrc="/grades-icon.svg"
          text="Grades"
          color="#CA8E02"
          to={`/adviser/classes/grades/${section.id}`}
        />
        <DashboardButton iconSrc="/reports-icon.svg" text="Reports" color="#8F28A4" />
      </div>
    </div>
  );
};

export default AdviserClassDetails;