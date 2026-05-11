/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Skeleton from "../../components/ui/Skeleton";
import InfoItem from "../../components/info/InfoItem";
import EmptyState from "../../components/ui/EmptyState";
import PageLayout from "../../components/layouts/PageLayout";
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

// [CONSTANT] Chart palette — matches AdminReportsAndStatistics
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#CA28A4"];

// ? [INTERFACE] Adviser profile from reports response
interface AdviserProfile {
  id: number;
  adviserId: string;
  name: string;
  email: string;
}

// ? [INTERFACE] Per-section summary row
interface SectionSummary {
  sectionId:       number;
  sectionName:     string;
  gradeLevel:      number;
  schoolYear:      string;
  enrolledCount:   number;
  sf9CompleteCount: number;
  sf9PendingCount: number;
}

// ? [INTERFACE] Full adviser reports data shape
interface AdviserReportsData {
  totalStudents:         number;
  totalSections:         number;
  totalFormsPending:     number;
  failingStudentsCount:  number;
  studentsByGrade:       { gradeLevel: number; count: number }[];
  studentsByModality:    { modality: string; count: number }[];
  averageGradesPerGrade: { gradeLevel: number; average: number }[];
  formStatusBreakdown:   { status: string; count: number }[];
  sectionSummaries:      SectionSummary[];
}

// [HELPER] Form status badge style
const getFormStatusStyle = (status: string) => {
  switch (status) {
    case "DRAFT":     return "bg-[var(--color-bg-200)] text-[var(--color-text-600)]";
    case "GENERATED": return "bg-amber-100 text-amber-700";
    case "SUBMITTED": return "bg-blue-100 text-blue-700";
    case "APPROVED":  return "bg-[var(--color-accent-100)] text-[var(--color-accent-700)]";
    case "LOCKED":    return "bg-[var(--color-bg-300)] text-[var(--color-text-500)]";
    default:          return "bg-[var(--color-bg-200)] text-[var(--color-text-600)]";
  }
};

const AdviserReportsAndStatistics = () => {
  usePageTitle("Reports & Statistics");

  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [profile, setProfile]   = useState<AdviserProfile | null>(null);
  const [reports, setReports]   = useState<AdviserReportsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // * [HANDLE] Fetch Adviser Reports
  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowTokenExpiredModal(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/reports`,
        {
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("token");
        setShowTokenExpiredModal(true);
        return;
      }

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Failed to fetch reports");

      setProfile(result.data.adviserProfile);
      setReports(result.data.data);
      setError(null);
    } catch (err: any) {
      // ! [ERROR] Fetching reports failed
      console.error("Error fetching adviser reports:", err);
      setError(err.message || "Failed to load reports");
      if (String(err).includes("401")) {
        localStorage.removeItem("token");
        setShowTokenExpiredModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  // ? [ERROR STATE]
  if (error || !reports) {
    return (
      <PageLayout header={<span className="page-title">Reports & Statistics</span>}>
        <div className="bg-[var(--color-bg-100)] rounded-lg p-10 text-center">
          <p className="text-[var(--color-red-600)] mb-6">{error || "No report data available"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-md transition-colors font-medium"
          >
            Retry Loading
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<span className="page-title">Reports & Statistics</span>}>
      <div className="space-y-6">

        {/* [CARD] Key Metrics Overview */}
        <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 shadow-md space-y-3">
          <h2 className="mb-1">Overview</h2>
          <div className="space-y-2">
            <InfoItem iconSrc="/dashboard-students.svg" text="My Students"      value={reports.totalStudents} />
            <InfoItem iconSrc="/sections.svg"           text="My Sections"      value={reports.totalSections} color="#0066CC" />
            <InfoItem iconSrc="/dashboard-school-forms.svg" text="Pending Forms" value={reports.totalFormsPending} color="#0066CC" />
            <InfoItem iconSrc="/dashboard-students.svg" text="Failing Students" value={reports.failingStudentsCount} color="#E60000" />
          </div>
        </div>

        {/* [SECTION] Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* [CHART] Students by Grade Level */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--color-text-800)] mb-5">
              Students by Grade Level
            </h3>
            {reports.studentsByGrade.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <EmptyState
                  title="No data yet"
                  subtitle="Grade distribution will appear once students are enrolled."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.studentsByGrade}>
                  <XAxis dataKey="gradeLevel" stroke="var(--color-text-500)" />
                  <YAxis stroke="var(--color-text-500)" />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-primary-600)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* [CHART] Students by Learning Modality */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--color-text-800)] mb-5">
              Students by Learning Modality
            </h3>
            {reports.studentsByModality.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <EmptyState
                  title="No data yet"
                  subtitle="Modality data will appear once students are enrolled."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
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
                    {reports.studentsByModality.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* [CHART] Average Grades per Grade Level — full-width */}
          {reports.averageGradesPerGrade.length > 0 && (
            <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-xl p-5 shadow-sm lg:col-span-2">
              <h3 className="font-semibold text-[var(--color-text-800)] mb-5">
                Average Grades by Grade Level
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.averageGradesPerGrade}>
                  <XAxis dataKey="gradeLevel" stroke="var(--color-text-500)" />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-500)" />
                  <Tooltip />
                  <Bar dataKey="average" fill="var(--color-accent-600)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>

        {/* [SECTION] School Form Status Breakdown */}
        {reports.formStatusBreakdown.length > 0 && (
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--color-text-800)] mb-4">
              School Form Status
            </h3>
            <div className="flex flex-wrap gap-3">
              {reports.formStatusBreakdown.map((f) => (
                <div
                  key={f.status}
                  className="flex items-center gap-2 bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getFormStatusStyle(f.status)}`}>
                    {f.status}
                  </span>
                  <span className="text-sm font-roboto font-bold text-[var(--color-text-900)]">
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* [TABLE] Per-Section SF9 Summary */}
        <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
          <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
            Section SF9 Progress
          </p>

          {reports.sectionSummaries.length === 0 ? (
            <EmptyState
              title="No sections assigned"
              subtitle="You have no sections assigned for the current school year."
            />
          ) : (
            <>
              {/* [TABLE] Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left">
                      <th className="table-header">Section</th>
                      <th className="table-header">Grade</th>
                      <th className="table-header">School Year</th>
                      <th className="table-header text-center">Enrolled</th>
                      <th className="table-header text-center">SF9 Complete</th>
                      <th className="table-header text-center">SF9 Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.sectionSummaries.map((s) => (
                      <tr
                        key={s.sectionId}
                        className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition"
                      >
                        {/* Section Name */}
                        <td className="table-cell table-text">
                          <span className="font-roboto font-semibold text-sm text-[var(--color-text-900)]">
                            {s.sectionName}
                          </span>
                        </td>

                        {/* Grade Level */}
                        <td className="table-cell table-text table-text-default">
                          Grade {s.gradeLevel}
                        </td>

                        {/* School Year */}
                        <td className="table-cell table-text table-text-default font-mono">
                          {s.schoolYear}
                        </td>

                        {/* Enrolled */}
                        <td className="table-cell table-text text-center">
                          <span className="font-roboto font-semibold text-sm text-[var(--color-text-900)]">
                            {s.enrolledCount}
                          </span>
                        </td>

                        {/* SF9 Complete */}
                        <td className="table-cell table-text text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--color-accent-100)] text-[var(--color-accent-700)]">
                            {s.sf9CompleteCount}
                          </span>
                        </td>

                        {/* SF9 Pending */}
                        <td className="table-cell table-text text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            s.sf9PendingCount === 0
                              ? "bg-[var(--color-bg-200)] text-[var(--color-text-500)]"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {s.sf9PendingCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* [CARDS] Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-3">
                {reports.sectionSummaries.map((s) => (
                  <div
                    key={s.sectionId}
                    className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 space-y-2"
                  >
                    {/* [HEADER] Section name + grade */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-roboto font-bold text-sm text-[var(--color-text-900)]">
                        {s.sectionName}
                      </p>
                      <span className="text-xs font-mono text-[var(--color-text-500)] flex-shrink-0">
                        {s.schoolYear}
                      </span>
                    </div>

                    <p className="text-xs font-roboto text-[var(--color-text-600)]">
                      Grade {s.gradeLevel} · {s.enrolledCount} enrolled
                    </p>

                    {/* [BADGES] SF9 progress */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-bg-200)]">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--color-accent-100)] text-[var(--color-accent-700)]">
                        {s.sf9CompleteCount} complete
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        s.sf9PendingCount === 0
                          ? "bg-[var(--color-bg-200)] text-[var(--color-text-500)]"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {s.sf9PendingCount} pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* [NOTE] Shown when no grade average data exists yet */}
        {reports.averageGradesPerGrade.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-500)] py-2">
            Average grades data will appear here once SF9 grades are recorded.
          </p>
        )}

      </div>
    </PageLayout>
  );
};

export default AdviserReportsAndStatistics;