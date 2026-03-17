import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MyClassCard from "../../components/MyClassCard";
import DashboardButton from "../../components/DashboardButton";
import ClassSummaryItem from "../../components/ClassSummaryItem";

interface ScheduleItem {
  day: string;
  time: string;
}

interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  color: string;
  classSize: number;
  schedule: ScheduleItem[];
}

const AdviserMyClass = () => {
  const { id } = useParams<{ id: string }>(); // section ID from URL
  const navigate = useNavigate();

  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

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

        if (!data.success) {
          setError(data.message || "Failed to fetch section");
          setSection(null);
        } else {
          const sec = data.data;
          setSection({
            id: sec.id,
            name: `${sec.gradeLevel} — ${sec.name}`,
            gradeLevel: sec.gradeLevel,
            schoolYear: sec.schoolYear,
            color: sec.color || "#999999",
            classSize: sec.classSize || 0,
            schedule: sec.schedule || [],
          });
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setSection(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSection();
  }, [id]);

  if (loading) return <p>Loading class...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!section) return <p>No section found.</p>;

  return (
    <div className="py-17 px-4 space-y-4 relative">
      {/* Floating Back Button */}
      <button
        onClick={() => navigate("/adviser/classes")}
        className="fixed top-20 left-6 z-2 flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] 
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
        Back
      </button>

      <MyClassCard
        id={section.id}
        key={section.id}
        name={section.name}
        schedule={section.schedule}
        classSize={section.classSize}
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
        <DashboardButton iconSrc="/view-students-icon.svg" text="View Students" color="#0066CC" />
        <DashboardButton iconSrc="/attendance-icon.svg" text="Attendance" color="#28A428" />
        <DashboardButton iconSrc="/grades-icon.svg" text="Grades" color="#CA8E02" />
        <DashboardButton iconSrc="/reports-icon.svg" text="Reports" color="#8F28A4" />
      </div>
    </div>
  );
};

export default AdviserMyClass;