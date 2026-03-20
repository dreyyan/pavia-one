import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
interface GradeItemApi {
  id: number;
  type: string;
  score: number | null;
  maxScore?: number;
  createdAt?: string;
  quarter?: number;
}

interface SubjectGradeApi {
  id: number;
  learningArea?: {
    name: string;
  };
  items?: GradeItemApi[];
}

interface GradingItem {
  id: number;
  criteria: string;
  score: number | null;
  maxScore?: number;
  createdAt?: string;
  quarter?: number;
  displayLabel?: string; // For table display
}

interface SubjectGradeDetail {
  id: number;
  subject: string;
  gradingItems: GradingItem[];
}

// Abbreviations
const CRITERIA_ABBREVIATIONS: Record<string, string> = {
  WRITTEN_WORK: "WW",
  PERFORMANCE_TASK: "PT",
  QUARTERLY_ASSESSMENT: "QA",
};

const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  Filipino: "FIL",
  English: "ENG",
  Mathematics: "MATH",
  Science: "SCI",
  "Araling Panlipunan": "AP",
  "Edukasyon sa Pagpapakatao": "ESP",
  MAPEH: "MAPEH",
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
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [filterQuarter, setFilterQuarter] = useState<number | "All">("All");

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "error" | "success" | "info" | "warning">("default");

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const token = localStorage.getItem("token");

  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      alert("Session expired. Please login again.");
      return null;
    }
    return await res.json();
  };

  const fetchGradeDetails = useCallback(async () => {
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

      const subjectGradeData = gradesData.data.find((g: SubjectGradeApi) => String(g.id) === subjectId);
      if (!subjectGradeData) {
        setError("Subject grade not found");
        setGrade(null);
        return;
      }

      setGrade({
        id: subjectGradeData.id,
        subject:
          SUBJECT_ABBREVIATIONS[subjectGradeData.learningArea?.name ?? ""] ??
          subjectGradeData.learningArea?.name ??
          "Unknown",
        gradingItems: (subjectGradeData.items ?? [])
          .sort((a: GradeItemApi, b: GradeItemApi) => {
            if (a.createdAt && b.createdAt)
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            return a.id - b.id;
          })
          .map((item: GradeItemApi) => ({
            id: item.id,
            criteria: item.type,
            score: item.score,
            maxScore: item.maxScore ?? 100,
            createdAt: item.createdAt,
            quarter: item.quarter,
          })),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setGrade(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, studentId, subjectId, token]);

  // ✅ useEffect now just calls the stable callback
  useEffect(() => {
    fetchGradeDetails();
  }, [fetchGradeDetails]);

  const getNumberedItems = (items: GradingItem[]) => {
    const counters: Record<string, number> = {};
    return items.map(item => {
      counters[item.criteria] = (counters[item.criteria] ?? 0) + 1;
      let abbrev = CRITERIA_ABBREVIATIONS[item.criteria] ?? item.criteria;
      if (item.criteria === "WRITTEN_WORK" || item.criteria === "PERFORMANCE_TASK") {
        abbrev = `${abbrev} ${counters[item.criteria]}`;
      }
      return { ...item, displayLabel: abbrev };
    });
  };

  const filteredItems = getNumberedItems(
    (grade?.gradingItems ?? []).filter(item => {
      const quarterMatch = filterQuarter === "All" || item.quarter === filterQuarter;
      const criteriaMatch = selectedCriteria === "All" || item.criteria === selectedCriteria;
      return quarterMatch && criteriaMatch;
    })
  );

  const createGradeItem = async () => {
    if (!grade || newItemScore === "" || newItemMaxScore === "" || !newItemCriteria) {
      setModalTitle("Validation Error");
      setModalMessage("Please enter a score, max score, and select a criteria.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    if (newItemCriteria === "QUARTERLY_ASSESSMENT") {
      const existingQA = grade.gradingItems.find(
        item => item.criteria === "QUARTERLY_ASSESSMENT" && item.quarter === selectedQuarter
      );
      if (existingQA) {
        setModalTitle("Duplicate Quarterly Assessment");
        setModalMessage(`A Quarterly Assessment already exists for Quarter ${selectedQuarter}. You cannot add another.`);
        setModalType("error");
        setShowModal(true);
        return;
      }
    }

    if (newItemScore < 0 || newItemMaxScore <= 0 || newItemScore > newItemMaxScore) {
      setModalTitle("Invalid Scores");
      setModalMessage("Score must be >= 0 and <= Max Score. Max Score must be > 0.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sf9GradeId: grade.id,
          quarter: selectedQuarter,
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
    } catch (err) {
      console.log(err);
      setModalTitle("Error");
      setModalMessage("Failed to add grade item. Please try again.");
      setModalType("error");
      setShowModal(true);
    }
  };

  const updateGradeItem = () => {
    if (!editingItem) return;

    if (newItemScore === "" || newItemMaxScore === "" || !newItemCriteria) {
      setModalTitle("Validation Error");
      setModalMessage("Please enter a score, max score, and select a criteria.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    if (newItemCriteria === "QUARTERLY_ASSESSMENT") {
      const existingQA = grade?.gradingItems.find(
        item => item.criteria === "QUARTERLY_ASSESSMENT" &&
                item.quarter === selectedQuarter &&
                item.id !== editingItem.id
      );
      if (existingQA) {
        setModalTitle("Duplicate Quarterly Assessment");
        setModalMessage(`A Quarterly Assessment already exists for Quarter ${selectedQuarter}. You cannot add another.`);
        setModalType("error");
        setShowModal(true);
        return;
      }
    }

    if (newItemScore < 0 || newItemMaxScore <= 0 || newItemScore > newItemMaxScore) {
      setModalTitle("Invalid Scores");
      setModalMessage("Score must be >= 0 and <= Max Score. Max Score must be > 0.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    setModalTitle("Confirm Update");
    setModalMessage("Are you sure you want to update this grade item?");
    setModalType("info");

    setPendingAction(() => async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item/${editingItem.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              quarter: selectedQuarter,
              type: newItemCriteria,
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

          setModalTitle("Success");
          setModalMessage("Grade item updated successfully.");
          setModalType("success");
          setShowModal(true);
        } else {
          setModalTitle("Error");
          setModalMessage(data?.message || "Failed to update grade item.");
          setModalType("error");
          setShowModal(true);
        }
      } catch (err) {
        console.log(err);
        setModalTitle("Error");
        setModalMessage("Failed to update grade item. Please try again.");
        setModalType("error");
        setShowModal(true);
      }
    });

    setShowModal(true);
  };

  const confirmDeleteGradeItem = (id: number) => {
    setModalTitle("Confirm Delete");
    setModalMessage("Are you sure you want to delete this item?");
    setModalType("warning");
    setPendingAction(() => async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ itemIds: [id] }),
          }
        );
        const data = await handleApiResponse(res);
        if (data?.success) {
          fetchGradeDetails();
        } else {
          setModalTitle("Error");
          setModalMessage(data?.message || "Failed to delete item.");
          setModalType("error");
          setShowModal(true);
        }
      } catch (err) {
        console.log(err);
        setModalTitle("Error");
        setModalMessage("Failed to delete item. Please try again.");
        setModalType("error");
        setShowModal(true);
      }
    });
    setShowModal(true);
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
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setPendingAction(null);
          }}
          onConfirm={() => {
            if (pendingAction) pendingAction();
            setShowModal(false);
            setPendingAction(null);
          }}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
          closeOnBackdrop={true}
          isCancelable={true}
        />
      )}

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Quarter filter */}
          <select
            value={filterQuarter}
            onChange={e => setFilterQuarter(e.target.value === "All" ? "All" : Number(e.target.value))}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value="All">All Quarters</option>
            <option value={1}>Quarter 1</option>
            <option value={2}>Quarter 2</option>
            <option value={3}>Quarter 3</option>
            <option value={4}>Quarter 4</option>
          </select>

          {/* Criteria filter */}
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
                        setSelectedQuarter(item.quarter ?? 1);
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-red-600 font-medium" onClick={() => confirmDeleteGradeItem(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow space-y-3">
        <h4 className="font-medium">
          {editingItem ? "Edit Grade Item" : "Add New Grade Item"}
        </h4>

        <div className="flex flex-col sm:flex-row gap-2">

          {/* ⭐ Quarter Dropdown */}
          <select
            value={selectedQuarter}
            onChange={e => setSelectedQuarter(Number(e.target.value))}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value={1}>Quarter 1</option>
            <option value={2}>Quarter 2</option>
            <option value={3}>Quarter 3</option>
            <option value={4}>Quarter 4</option>
          </select>

          {/* Criteria */}
          <select
            value={newItemCriteria}
            onChange={e => setNewItemCriteria(e.target.value)}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Score */}
          <input
            type="number"
            placeholder="Score"
            value={newItemScore}
            onChange={e => setNewItemScore(Number(e.target.value))}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          />

          {/* Max Score */}
          <input
            type="number"
            placeholder="Max Score"
            value={newItemMaxScore}
            onChange={e => setNewItemMaxScore(Number(e.target.value))}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          />

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => (editingItem ? updateGradeItem() : createGradeItem())}
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
                  setSelectedQuarter(1); // reset
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