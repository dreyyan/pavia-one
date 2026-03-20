import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface GradingItem {
  id: number;
  criteria: string;
  score: number | null;
  maxScore?: number;
}

interface SubjectGradeDetail {
  id: number;
  subject: string;
  gradingItems: GradingItem[];
}

// Add this mapping at the top
const CRITERIA_ABBREVIATIONS: Record<string, string> = {
  WRITTEN_WORK: "WW",
  PERFORMANCE_TASK: "PT",
  QUARTERLY_ASSESSMENT: "QA",
};

const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  "Filipino": "FIL",
  "English": "ENG",
  "Mathematics": "MATH",
  "Science": "SCI",
  "Araling Panlipunan": "AP",
  "Edukasyon sa Pagpapakatao": "ESP",
  "MAPEH": "MAPEH",
  "Edukasyong Pantahanan at Pangkabuhayan": "EPP/TLE",
};

const CRITERIA_LABELS: Record<string, string> = {
  WRITTEN_WORK: "Written Works",
  PERFORMANCE_TASK: "Performance Tasks",
  QUARTERLY_ASSESSMENT: "Quarterly Assessment",
};

const AdviserClassStudentGradesDetails = () => {
  const { sectionId, studentId, subjectId } = useParams<{
    sectionId: string;
    studentId: string;
    subjectId: string;
  }>();
  const navigate = useNavigate();

  const [grade, setGrade] = useState<SubjectGradeDetail | null>(null);
  const [profileName, setProfileName] = useState("Unknown Name");
  const [advisorySection, setAdvisorySection] = useState<{ gradeLevel: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<string>("All");
  const [editingItem, setEditingItem] = useState<GradingItem | null>(null);
  const [newItemScore, setNewItemScore] = useState<number | "">("");
  const [newItemMaxScore, setNewItemMaxScore] = useState<number | "">(100);
  const [newItemCriteria, setNewItemCriteria] = useState<string>("WRITTEN_WORK");

  const token = localStorage.getItem("token");

  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      alert("Session expired. Please login again.");
      return null;
    }
    return await res.json();
  };

  const fetchGradeDetails = async () => {
    if (!sectionId || !studentId || !subjectId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch student info
      const studentRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const studentData = await handleApiResponse(studentRes);
      if (studentData?.success) {
        setProfileName(studentData.data.fullName ?? "Unknown Name");
        setAdvisorySection({
          gradeLevel: String(studentData.data.gradeLevel),
          name: studentData.data.sectionName,
        });
      }

      // Fetch SF9 grades
      const gradesRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const gradesData = await handleApiResponse(gradesRes);
      if (!gradesData?.success || !gradesData.data) {
        setError(gradesData?.message || "Failed to fetch grades");
        setGrade(null);
        return;
      }

      const subjectGradeData = gradesData.data.find((g: any) => String(g.id) === subjectId);
      if (!subjectGradeData) {
        setError("Subject grade not found");
        setGrade(null);
        return;
      }

setGrade({
  id: subjectGradeData.id,
  subject: SUBJECT_ABBREVIATIONS[subjectGradeData.learningArea?.name] 
          ?? subjectGradeData.learningArea?.name 
          ?? "Unknown",
  gradingItems: (subjectGradeData.items ?? [])
    .sort((a: any, b: any) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.id - b.id;
    })
    .map((item: any) => ({
      id: item.id,
      criteria: item.type,
      score: item.score,
      maxScore: item.maxScore ?? 100,
    }))
});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setGrade(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeDetails();
  }, [sectionId, studentId, subjectId]);

  // Numbered criteria labels (abbreviated)
  const getNumberedItems = (items: GradingItem[]) => {
    const counters: Record<string, number> = {};
    return items.map(item => {
      counters[item.criteria] = (counters[item.criteria] ?? 0) + 1;
      let abbrev = CRITERIA_ABBREVIATIONS[item.criteria] ?? item.criteria;
      
      // Add numbering for WW and PT only
      if (item.criteria === "WRITTEN_WORK" || item.criteria === "PERFORMANCE_TASK") {
        abbrev = `${abbrev} ${counters[item.criteria]}`;
      }

      return { ...item, displayLabel: abbrev };
    });
  };

  const filteredItems = getNumberedItems(
    selectedCriteria === "All"
      ? grade?.gradingItems ?? []
      : (grade?.gradingItems ?? []).filter(item => item.criteria === selectedCriteria)
  );

  // CRUD handlers
  const createGradeItem = async () => {
    if (!grade || newItemScore === "" || newItemMaxScore === "" || !newItemCriteria)
      return alert("Enter score, max score, and criteria");

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sf9GradeId: grade.id,
        quarter: 1,
        type: newItemCriteria,
        score: Number(newItemScore),
        maxScore: Number(newItemMaxScore)
      })
    });
    const data = await handleApiResponse(res);
    if (data?.success) {
      setNewItemScore("");
      setNewItemMaxScore(100);
      setNewItemCriteria("WRITTEN_WORK");
      fetchGradeDetails();
    }
  };

  const updateGradeItem = async () => {
    if (!editingItem) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item/${editingItem.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quarter: 1,
          type: newItemCriteria,  // ← use the new selected criteria
          score: Number(newItemScore),
          maxScore: Number(newItemMaxScore),
        }),
      }
    );

    const data = await handleApiResponse(res);
    if (data?.success) {
      setEditingItem(null);
      setNewItemScore("");
      setNewItemMaxScore(100);
      setNewItemCriteria("WRITTEN_WORK");
      fetchGradeDetails();
    }
  };

  const deleteGradeItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemIds: [id] })
    });
    const data = await handleApiResponse(res);
    if (data?.success) fetchGradeDetails();
  };

  if (loading) return <p className="text-center py-4">Loading subject grade...</p>;
  if (error) return <p className="text-red-500 text-center py-4">{error}</p>;
  if (!grade) return <p className="text-center py-4">Grade not available.</p>;

  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    { label: advisorySection ? `${advisorySection.gradeLevel} — ${advisorySection.name}` : "Unknown Section", path: `/adviser/classes/${sectionId}` },
    { label: "Grades", path: `/adviser/classes/grades/${sectionId}` },
    { label: profileName, path: `/adviser/classes/grades/${sectionId}/${studentId}` },
    { label: grade.subject, path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-6 max-w-md mx-auto">
      {/* Breadcrumb */}
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx}>
            {crumb.path ? (
              <span className="hover:underline cursor-pointer" onClick={() => navigate(crumb.path!)}>{crumb.label}</span>
            ) : (
              <span className="font-roboto font-medium text-[var(--color-text-900)]">{crumb.label}</span>
            )}
            {idx < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      <div className="flex items-center bg-[var(--color-primary-600)] border-3 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md">
        <div className="bg-[var(--color-bg-200)] w-18 h-18 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">{profileName}</p>
          {advisorySection ? (
            <>
              <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">Grade {advisorySection.gradeLevel} — {advisorySection.name}</p>
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">Student</p>
            </>
          ) : (
            <p className="text-red-600 font-semibold text-sm">You are not assigned to any advisory section.</p>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg space-y-4">
        {/* Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <select
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
            value={selectedCriteria}
            onChange={e => setSelectedCriteria(e.target.value)}
          >
            <option value="All">All</option>
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-t-lg shadow overflow-x-auto">
          <table className="table-fixed w-full divide-y divide-gray-200">
            <colgroup>
              <col className="w-1/3" />
              <col className="w-1/3" />
              <col className="w-1/3" />
            </colgroup>
            <thead className="bg-blue-600 text-white text-sm">
              <tr>
                <th className="px-2 py-2 text-left truncate">Criteria</th>
                <th className="px-2 py-2 text-left">Score</th>
                <th className="px-2 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 truncate cursor-pointer" title={item.displayLabel}>
                    {item.displayLabel}
                  </td>
                  <td className="px-2 py-2 text-left">{item.score != null ? `${item.score} / ${item.maxScore}` : "-"}</td>
                  <td className="px-2 py-2 flex justify-center gap-2">
                    <button
                      className="text-blue-600 font-medium"
                      onClick={() => {
                        setEditingItem(item);
                        setNewItemScore(item.score ?? "");
                        setNewItemMaxScore(item.maxScore ?? 100);
                        setNewItemCriteria(item.criteria);
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-red-600 font-medium" onClick={() => deleteGradeItem(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow space-y-3">
        <h4 className="font-medium">{editingItem ? "Edit Grade Item" : "Add New Grade Item"}</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={newItemCriteria}
            onChange={e => setNewItemCriteria(e.target.value)}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Score"
            value={newItemScore}
            onChange={e => setNewItemScore(e.target.value)}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          />
          <input
            type="number"
            placeholder="Max Score"
            value={newItemMaxScore}
            onChange={e => setNewItemMaxScore(e.target.value)}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          />
          <div className="flex gap-2">
            <button
              onClick={() => editingItem ? updateGradeItem() : createGradeItem()}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              {editingItem ? "Update" : "Add"}
            </button>
            {editingItem && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNewItemScore("");
                  setNewItemMaxScore(100);
                  setNewItemCriteria("WRITTEN_WORK");
                }}
                className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdviserClassStudentGradesDetails;