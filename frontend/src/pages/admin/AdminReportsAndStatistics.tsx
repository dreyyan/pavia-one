// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";

// [IMPORT] Recharts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ? [INTERFACES]
interface DashboardProfile {
  id: number;
  name: string;
  email: string;
}

interface ReportsData {
  totalStudents: number;
  totalAdvisers: number;
  totalSections: number;
  totalFormsPending: number;
  studentsByGrade: { gradeLevel: string; count: number }[];
  studentsByModality: { modality: string; count: number }[];
  sectionsPerAdviser: { adviserName: string; sections: number }[];
  averageGradesPerGrade: { gradeLevel: string; average: number }[];
  failingStudentsCount: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#CA28A4"];

// *────────────────────────────────────────────────
// * Admin Reports & Statistics Component
// *────────────────────────────────────────────────
const AdminReportsAndStatistics = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  // * [EFFECT] Fetch reports data
  useEffect(() => {
    const token = localStorage.getItem("token"); // may be null

    const fetchReports = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reports`, {
          headers: { 
            Authorization: token ? `Bearer ${token}` : "", 
            "Content-Type": "application/json" 
          },
        });

        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          return;
        }

        const data: { success: boolean; data: ReportsData; adminProfile: DashboardProfile } =
          await res.json();

        if (!data.success) {
          console.error("Failed to fetch reports:", data);
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        // Map backend response
        setProfile(data.adminProfile);
        setReports(data.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        localStorage.removeItem("token");
        setShowTokenExpiredModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [setShowTokenExpiredModal]);

  if (loading) return <Skeleton />;

  return (
    <div className="py-10 px-4 space-y-6">
      {/* [HEADER] */}
      <h1 className="text-[var(--color-text-800)]">Admin Reports & Statistics</h1>

      {/* [SECTION] Profile */}
      <div className="relative flex items-center bg-[var(--color-bg-100)] rounded-lg px-4 py-3 gap-x-4 shadow-md">
        <div className="flex-1">
          <h2 className="font-roboto font-extrabold text-[var(--color-text-800)]">
            {profile?.name}
          </h2>
          <p className="body-large text-[var(--color-text-800)]">Administrator</p>
        </div>

        {/* [BUTTON] Profile */}
        <button
          onClick={() => navigate("/admin/profile")}
          className="p-2 rounded-sm bg-[var(--color-secondary-500)] cursor-pointer"
        >
          <img src="/profile-icon-white.svg" alt="Profile" className="w-4 h-4" />
        </button>
      </div>

      {/* [SECTION] Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-bg-100)] rounded-lg p-4 shadow-md">
          <p className="text-sm">Total Students</p>
          <h3 className="text-xl font-bold">{reports?.totalStudents}</h3>
        </div>
        <div className="bg-[var(--color-bg-100)] rounded-lg p-4 shadow-md">
          <p className="text-sm">Total Advisers</p>
          <h3 className="text-xl font-bold">{reports?.totalAdvisers}</h3>
        </div>
        <div className="bg-[var(--color-bg-100)] rounded-lg p-4 shadow-md">
          <p className="text-sm">Total Sections</p>
          <h3 className="text-xl font-bold">{reports?.totalSections}</h3>
        </div>
        <div className="bg-[var(--color-bg-100)] rounded-lg p-4 shadow-md">
          <p className="text-sm">Pending Forms</p>
          <h3 className="text-xl font-bold">{reports?.totalFormsPending}</h3>
        </div>
      </div>

      {/* [SECTION] Students by Grade Level */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow-md">
        <h2 className="mb-3">Students by Grade Level</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reports?.studentsByGrade || []}>
            <XAxis dataKey="gradeLevel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* [SECTION] Students by Learning Modality */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow-md">
        <h2 className="mb-3">Students by Learning Modality</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={reports?.studentsByModality || []}
              dataKey="count"
              nameKey="modality"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {(reports?.studentsByModality || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* [SECTION] Sections per Adviser */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow-md">
        <h2 className="mb-3">Sections per Adviser</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reports?.sectionsPerAdviser || []}>
            <XAxis dataKey="adviserName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sections" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* [SECTION] Average Grades per Grade Level */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow-md">
        <h2 className="mb-3">Average Grades per Grade Level</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reports?.averageGradesPerGrade || []}>
            <XAxis dataKey="gradeLevel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="average" fill="#FFBB28" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* [SECTION] Failing Students Count */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow-md">
        <h2 className="mb-3">Failing Students</h2>
        <h3 className="text-xl font-bold">{reports?.failingStudentsCount}</h3>
      </div>
    </div>
  );
};

export default AdminReportsAndStatistics;