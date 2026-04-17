/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import DashboardItem from "../../components/DashboardItem";
import Skeleton from "../../components/Skeleton";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#CA28A4"];

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
  studentsByGrade: { gradeLevel: number; count: number }[];
  studentsByModality: { modality: string; count: number }[];
  sectionsPerAdviser: { adviserName: string; sections: number }[];
  averageGradesPerGrade: { gradeLevel: number; average: number }[];
  failingStudentsCount: number;
}

const AdminReportsAndStatistics = () => {
  usePageTitle("Reports & Statistics");

  const { setShowTokenExpiredModal } = useAuth();

  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setShowTokenExpiredModal(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
          return;
        }

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch reports");
        }

        setProfile(result.data.adminProfile);
        setReports(result.data.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching reports:", err);
        setError(err.message || "Failed to load reports");
        if (String(err).includes("401")) {
          localStorage.removeItem("token");
          setShowTokenExpiredModal(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [setShowTokenExpiredModal]);

  if (loading) return <Skeleton />;

  if (error || !reports) {
    return (
      <div className="py-10 px-4">
        <h1 className="text-[var(--color-text-800)]">Reports & Statistics</h1>
        <div className="mt-8 bg-[var(--color-bg-100)] rounded-lg p-10 text-center">
          <p className="text-[var(--color-red-600)] mb-6">{error || "No report data available"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-md transition-colors font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 space-y-4 max-w-7xl mx-auto">
        {/* [SECTION] Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[var(--color-text-800)] leading-tight">Reports & Statistics</h2>
            <p className="text-sm text-[var(--color-text-700)] mt-0.5 font-roboto">
              Overview of school performance and enrollment data.
            </p>
          </div>
        </div>

      {/* [SECTION] Key Metrics */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 gap-x-3 shadow-md">
        <h2 className="mb-3">Overview</h2>
        <div className="space-y-2">
          <DashboardItem iconSrc="/total-sections-icon.svg" text="Total Students" value={reports.totalStudents} />
          <DashboardItem iconSrc="/total-advisers-icon.svg" text="Total Advisers" value={reports.totalAdvisers} color="#0066CC" />
          <DashboardItem iconSrc="/total-sections-icon.svg" text="Total Sections" value={reports.totalSections} />
          <DashboardItem iconSrc="/school-forms-dashboard.svg" text="Pending Forms" value={reports.totalFormsPending} color="#0066CC" />
          <DashboardItem iconSrc="/students-dashboard-icon.svg" text="Failing Students" value={reports.failingStudentsCount} color="#E60000" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Grade Level */}
        <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--color-text-800)] mb-5">Students by Grade Level</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={reports.studentsByGrade}>
              <XAxis dataKey="gradeLevel" stroke="var(--color-text-500)" />
              <YAxis stroke="var(--color-text-500)" />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary-600)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Students by Learning Modality */}
        <div className="bg-[var(--color-bg-100)] rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--color-text-800)] mb-5">Students by Learning Modality</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={reports.studentsByModality}
                dataKey="count"
                nameKey="modality"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >
                {reports.studentsByModality.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sections per Adviser */}
        <div className="bg-[var(--color-bg-100)] rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-[var(--color-text-800)] mb-5">Sections per Adviser</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={reports.sectionsPerAdviser}>
              <XAxis 
                dataKey="adviserName" 
                angle={-30} 
                textAnchor="end" 
                height={70}
                stroke="var(--color-text-500)"
              />
              <YAxis stroke="var(--color-text-500)" />
              <Tooltip />
              <Bar dataKey="sections" fill="var(--color-accent-600)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Note for empty average grades */}
      {reports.averageGradesPerGrade.length === 0 && (
        <div className="text-center text-sm text-[var(--color-text-500)] py-4">
          Average grades data will appear here once SF9 grades are recorded.
        </div>
      )}
    </div>
  );
};

export default AdminReportsAndStatistics;