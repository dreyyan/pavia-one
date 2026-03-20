// [IMPORT] Hooks
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/Modal";

// ?[INTERFACES]
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
  learningArea?: { name: string };
  items?: GradeItemApi[];
}

interface GradingItem {
  id: number;
  criteria: string;
  score: number | null;
  maxScore: number;
  createdAt?: string;
  quarter: number;
  displayLabel?: string;
}

interface SubjectGradeDetail {
  id: number;
  subject: string;
  gradingItems: GradingItem[];
}

// ?[CONSTANTS]
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

// ?[HELPERS]

// [HELPER] Assigns sequential display labels (e.g., "WW 1", "PT 2", "QA") to items.
const buildNumberedItems = (items: GradingItem[]): GradingItem[] => {
  // Counters keyed by "criteria-quarter" so WW numbering resets per quarter
  const counters: Record<string, number> = {};

  return items.map((item) => {
    const key = `${item.criteria}-${item.quarter}`;
    counters[key] = (counters[key] ?? 0) + 1;

    const abbrev = CRITERIA_ABBREVIATIONS[item.criteria] ?? item.criteria;
    const displayLabel =
      item.criteria === "WRITTEN_WORK" || item.criteria === "PERFORMANCE_TASK"
        ? `${abbrev} ${counters[key]}`
        : abbrev; // QA has no sequence number

    return { ...item, displayLabel };
  });
};

const AdviserClassStudentGradesDetails = () => {
  const { sectionId, studentId, subjectId } = useParams<{
    sectionId: string;
    studentId: string;
    subjectId: string;
  }>();
  const navigate = useNavigate();

  // [STATES] Core data
  const [grade, setGrade] = useState<SubjectGradeDetail | null>(null);
  const [profileName, setProfileName] = useState("Unknown Name");
  const [advisorySection, setAdvisorySection] = useState<{
    gradeLevel: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [STATES] Filter
  const [selectedCriteria, setSelectedCriteria] = useState<string>("All");
  const [filterQuarter, setFilterQuarter] = useState<number | "All">("All");
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);

  // [STATES] Add / edit form
  const [editingItem, setEditingItem] = useState<GradingItem | null>(null);
  const [newItemScore, setNewItemScore] = useState<number | "">("");
  const [newItemMaxScore, setNewItemMaxScore] = useState<number | "">(100);
  const [newItemCriteria, setNewItemCriteria] = useState<string>("WRITTEN_WORK");

  // [STATES] Quarter lock
  const [quarterLocked, setQuarterLocked] = useState<Record<number, boolean>>({});

  // [STATES] Modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<
    "default" | "error" | "success" | "info" | "warning"
  >("default");

  /**
   * Use a ref instead of state for pendingAction.
   * React's setState(fn) treats `fn` as an updater and calls it immediately —
   * storing an async function via setState would invoke it. A ref avoids this.
   */
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);

  const token = localStorage.getItem("token");

  // ?[DERIVED] Per-quarter status for the status indicator row
  const quarterStatus: Record<number, { hasGrades: boolean; locked: boolean }> =
    [1, 2, 3, 4].reduce(
      (acc, q) => {
        const itemsInQuarter =
          grade?.gradingItems.filter((item) => item.quarter === q) ?? [];
        acc[q] = {
          hasGrades: itemsInQuarter.length > 0,
          locked: !!quarterLocked[q],
        };
        return acc;
      },
      {} as Record<number, { hasGrades: boolean; locked: boolean }>
    );

  // ?[DERIVED] Lock state for the currently selected form quarter
  const isLocked = !!quarterLocked[selectedQuarter];

  // ---------------------------------------------------------------------------
  // API helpers
  // ---------------------------------------------------------------------------

  const handleApiResponse = async (res: Response) => {
    // ![ERROR] Expired token
    if (res.status === 401) {
      alert("Session expired. Please login again.");
      return null;
    }
    return res.json();
  };

  // *[EFFECT] Fetch student info + SF9 grades (single request — sf9Grades is embedded in the student response)
  const fetchGradeDetails = useCallback(async () => {
    if (!sectionId || !studentId || !subjectId) return;

    setLoading(true);
    setError(null);

    try {
      // Single fetch — student endpoint already includes sf9Grades with items & learningArea
      const studentRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const studentData = await handleApiResponse(studentRes);

      // ![ERROR] Backend failure or missing data
      if (!studentData?.success || !studentData.data) {
        setError(studentData?.message || "Failed to fetch student");
        setGrade(null);
        return;
      }

      const s = studentData.data;

      setProfileName(s.fullName ?? "Unknown Name");
      setAdvisorySection({
        gradeLevel: String(s.gradeLevel),
        name: s.sectionName,
      });

      // sf9Grades is an array embedded directly in the student response
      const gradesArray: SubjectGradeApi[] = Array.isArray(s.sf9Grades)
        ? s.sf9Grades
        : [];

      // ![ERROR] No grades array on the student record
      if (gradesArray.length === 0) {
        setError("No SF9 grades found for this student");
        setGrade(null);
        return;
      }

      const subjectGradeData = gradesArray.find(
        (g: SubjectGradeApi) => g?.id === Number(subjectId)
      );

      // ![ERROR] Subject grade not found in response
      if (!subjectGradeData) {
        setError("Subject grade not found");
        setGrade(null);
        return;
      }

      // Sort items by createdAt then id so numbering is deterministic
      const sortedItems: GradingItem[] = (subjectGradeData.items ?? [])
        .slice()
        .sort((a: GradeItemApi, b: GradeItemApi) => {
          if (a.createdAt && b.createdAt)
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          return a.id - b.id;
        })
        .map((item: GradeItemApi) => ({
          id: item.id,
          criteria: item.type,
          score: item.score,
          maxScore: item.maxScore ?? 100,
          createdAt: item.createdAt,
          quarter: item.quarter ?? 1, // default to Q1 if undefined
        }));

      const gradeId = subjectGradeData.id;

      setGrade({
        id: gradeId,
        subject:
          SUBJECT_ABBREVIATIONS[subjectGradeData.learningArea?.name ?? ""] ??
          subjectGradeData.learningArea?.name ??
          "Unknown",
        gradingItems: sortedItems,
      });

      // Fetch quarter lock status using the SF9 *grade* ID (not studentId)
      try {
        const lockRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/${gradeId}/quarter-status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lockData = await handleApiResponse(lockRes);
        if (lockData?.success) {
          setQuarterLocked(lockData.data ?? {});
        }
      } catch (lockErr) {
        console.warn("Failed to fetch quarter status", lockErr);
      }
    } catch (err: unknown) {
      // ![ERROR] Network or unexpected failure
      setError(err instanceof Error ? err.message : String(err));
      setGrade(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, studentId, subjectId, token]);

  useEffect(() => {
    fetchGradeDetails();
  }, [fetchGradeDetails]);

  // ---------------------------------------------------------------------------
  // Quarter lock toggle
  // ---------------------------------------------------------------------------

  const toggleQuarterLock = async (quarter: number) => {
    if (!grade?.id) return;

    // ![ERROR] Cannot lock a quarter with no items
    const quarterItems = grade.gradingItems.filter(
      (item) => item.quarter === quarter
    );
    if (quarterItems.length === 0) {
      setModalTitle("Cannot Lock Quarter");
      setModalMessage(
        `Quarter ${quarter} has no grade items. Add at least one item before locking.`
      );
      setModalType("error");
      setShowModal(true);
      return;
    }

    const isCurrentlyLocked = !!quarterLocked[quarter];

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/${grade.id}/quarter-ready`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quarter: `q${quarter}`,
            ready: !isCurrentlyLocked,
          }),
        }
      );
      const data = await handleApiResponse(res);

      if (data?.success) {
        const newLockValue: boolean =
          data.data[`q${quarter}Ready`] ?? !isCurrentlyLocked;
        setQuarterLocked((prev) => ({ ...prev, [quarter]: newLockValue }));
        setModalTitle("Success");
        setModalMessage(
          `Quarter ${quarter} has been ${newLockValue ? "locked" : "unlocked"} successfully.`
        );
        setModalType("success");
        setShowModal(true);
      } else {
        throw new Error(data?.message || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      setModalTitle("Error");
      setModalMessage(
        `Failed to ${!isCurrentlyLocked ? "lock" : "unlock"} Quarter ${quarter}.`
      );
      setModalType("error");
      setShowModal(true);
    }
  };

  // ---------------------------------------------------------------------------
  // CRUD helpers
  // ---------------------------------------------------------------------------

  const showInfoModal = (
    title: string,
    message: string,
    type: typeof modalType
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    pendingActionRef.current = null;
    setShowModal(true);
  };

  const validateScores = (
    score: number | "",
    maxScore: number | ""
  ): string | null => {
    if (score === "" || maxScore === "")
      return "Please enter a score and max score.";
    if (maxScore <= 0) return "Max Score must be greater than 0.";
    if (score < 0) return "Score cannot be negative.";
    if (score > maxScore) return "Score cannot exceed Max Score.";
    return null;
  };

  const resetForm = () => {
    setEditingItem(null);
    setNewItemScore("");
    setNewItemMaxScore(100);
    setNewItemCriteria("WRITTEN_WORK");
  };

  // [CREATE] Add a new grade item
  const createGradeItem = async () => {
    if (!grade) return;

    const validationError = validateScores(newItemScore, newItemMaxScore);
    if (validationError) {
      showInfoModal("Validation Error", validationError, "error");
      return;
    }

    if (!newItemCriteria) {
      showInfoModal("Validation Error", "Please select a criteria.", "error");
      return;
    }

    // ![ERROR] Duplicate QA guard
    if (newItemCriteria === "QUARTERLY_ASSESSMENT") {
      const existingQA = grade.gradingItems.find(
        (item) =>
          item.criteria === "QUARTERLY_ASSESSMENT" &&
          item.quarter === selectedQuarter
      );
      if (existingQA) {
        showInfoModal(
          "Duplicate Quarterly Assessment",
          `A Quarterly Assessment already exists for Quarter ${selectedQuarter}. You cannot add another.`,
          "error"
        );
        return;
      }
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sf9GradeId: grade.id,
            quarter: selectedQuarter,
            type: newItemCriteria,
            score: Number(newItemScore),
            maxScore: Number(newItemMaxScore),
          }),
        }
      );
      const data = await handleApiResponse(res);

      if (data?.success) {
        resetForm();
        // Optimistic update — append new item immediately, then background refresh
        if (data.data) {
          const newItem: GradingItem = {
            id: data.data.id,
            criteria: data.data.type,
            score: data.data.score,
            maxScore: data.data.maxScore ?? 100,
            createdAt: data.data.createdAt,
            quarter: data.data.quarter ?? selectedQuarter,
          };
          setGrade((prev) =>
            prev
              ? { ...prev, gradingItems: [...prev.gradingItems, newItem] }
              : prev
          );
        }
        await fetchGradeDetails();
      } else {
        showInfoModal("Error", data?.message || "Failed to add grade item.", "error");
      }
    } catch (err) {
      console.error(err);
      showInfoModal("Error", "Failed to add grade item. Please try again.", "error");
    }
  };

  // [UPDATE] Edit an existing grade item
  const updateGradeItem = () => {
    if (!editingItem) return;

    const validationError = validateScores(newItemScore, newItemMaxScore);
    if (validationError) {
      showInfoModal("Validation Error", validationError, "error");
      return;
    }

    // ![ERROR] Duplicate QA guard — exclude the item being edited
    if (newItemCriteria === "QUARTERLY_ASSESSMENT") {
      const existingQA = grade?.gradingItems.find(
        (item) =>
          item.criteria === "QUARTERLY_ASSESSMENT" &&
          item.quarter === selectedQuarter &&
          item.id !== editingItem.id
      );
      if (existingQA) {
        showInfoModal(
          "Duplicate Quarterly Assessment",
          `A Quarterly Assessment already exists for Quarter ${selectedQuarter}.`,
          "error"
        );
        return;
      }
    }

    // Use ref to store the pending async action (avoids React treating it as a state updater)
    pendingActionRef.current = async () => {
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
          resetForm();
          // Optimistic update — patch in-place, then background refresh
          setGrade((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              gradingItems: prev.gradingItems.map((item) =>
                item.id === editingItem.id
                  ? {
                      ...item,
                      criteria: newItemCriteria,
                      score: Number(newItemScore),
                      maxScore: Number(newItemMaxScore),
                      quarter: selectedQuarter,
                    }
                  : item
              ),
            };
          });
          await fetchGradeDetails();
          showInfoModal("Success", "Grade item updated successfully.", "success");
        } else {
          showInfoModal("Error", data?.message || "Failed to update grade item.", "error");
        }
      } catch (err) {
        console.error(err);
        showInfoModal("Error", "Failed to update grade item. Please try again.", "error");
      }
    };

    setModalTitle("Confirm Update");
    setModalMessage("Are you sure you want to update this grade item?");
    setModalType("info");
    setShowModal(true);
  };

  // [DELETE] Remove a grade item
  const confirmDeleteGradeItem = (id: number) => {
    // Use ref to store the pending async action
    pendingActionRef.current = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ itemIds: [id] }),
          }
        );
        const data = await handleApiResponse(res);

        if (data?.success) {
          // Optimistic update — remove item immediately, then refresh
          setGrade((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              gradingItems: prev.gradingItems.filter((item) => item.id !== id),
            };
          });
          await fetchGradeDetails();
        } else {
          showInfoModal("Error", data?.message || "Failed to delete item.", "error");
        }
      } catch (err) {
        console.error(err);
        showInfoModal("Error", "Failed to delete item. Please try again.", "error");
      }
    };

    setModalTitle("Confirm Delete");
    setModalMessage("Are you sure you want to delete this grade item?");
    setModalType("warning");
    setShowModal(true);
  };

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

  const handleModalClose = () => {
    setShowModal(false);
    pendingActionRef.current = null;
  };

  const handleModalConfirm = async () => {
    setShowModal(false);
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null; // clear before calling to prevent double-fire
      await action();
    }
  };

  // ?[DERIVED] Build display labels from the full list, then filter
  const numberedItems = buildNumberedItems(grade?.gradingItems ?? []);

  const filteredItems = numberedItems.filter((item) => {
    const quarterMatch =
      filterQuarter === "All" || item.quarter === filterQuarter;
    const criteriaMatch =
      selectedCriteria === "All" || item.criteria === selectedCriteria;
    return quarterMatch && criteriaMatch;
  });

  // [LOADING STATE] Wait for data fetch
  if (loading)
    return <p className="text-center py-4">Loading subject grade...</p>;
  if (error)
    return <p className="text-red-500 text-center py-4">{error}</p>;
  if (!grade)
    return <p className="text-center py-4">Grade not available.</p>;

  // Breadcrumbs navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    {
      label: advisorySection
        ? `${advisorySection.gradeLevel} — ${advisorySection.name}`
        : "Unknown Section",
      path: `/adviser/classes/${sectionId}`,
    },
    { label: "Grades", path: `/adviser/classes/grades/${sectionId}` },
    {
      label: profileName,
      path: `/adviser/classes/grades/${sectionId}/${studentId}`,
    },
    { label: grade.subject, path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-6 max-w-md mx-auto">
      {/* [COMPONENT] Confirmation / info modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
          closeOnBackdrop={true}
          isCancelable={true}
        />
      )}

      {/* [SECTION] Breadcrumbs Navigation */}
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx}>
            {crumb.path ? (
              <span
                className="hover:underline cursor-pointer"
                onClick={() => navigate(crumb.path!)}
              >
                {crumb.label}
              </span>
            ) : (
              <span className="font-roboto font-medium text-[var(--color-text-900)]">
                {crumb.label}
              </span>
            )}
            {idx < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      {/* [SECTION] Student Header */}
      <div className="flex items-center bg-[var(--color-primary-600)] border-3 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md">
        <div className="bg-[var(--color-bg-200)] w-18 h-18 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">
            {profileName}
          </p>
          {advisorySection ? (
            <>
              <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">
                Grade {advisorySection.gradeLevel} — {advisorySection.name}
              </p>
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">
                Student
              </p>
            </>
          ) : (
            <p className="text-red-600 font-semibold text-sm">
              You are not assigned to any advisory section.
            </p>
          )}
        </div>
      </div>

      {/* [SECTION] Quarter Status Indicators */}
      <div className="flex justify-center gap-4 mb-4 bg-[var(--color-bg-100)] p-4 rounded-lg">
        {[1, 2, 3, 4].map((q) => {
          const status = quarterStatus[q];

          let bgColor = "bg-gray-300";
          let label = "No grades";

          if (status.hasGrades && status.locked) {
            bgColor = "bg-green-600";
            label = "Locked";
          } else if (status.hasGrades && !status.locked) {
            bgColor = "bg-yellow-400";
            label = "Has grades";
          } else {
            bgColor = "bg-red-600";
            label = "No grades";
          }

          return (
            <div key={q} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full ${bgColor}`} />
              <span className="text-sm font-semibold font-figtree">Q{q}</span>
              <span className="text-xs text-[var(--color-text-800)]">{label}</span>
            </div>
          );
        })}
      </div>

      {/* [SECTION] Filters & Grade Table */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* [COMPONENT] Quarter Filter */}
          <select
            value={filterQuarter}
            onChange={(e) =>
              setFilterQuarter(
                e.target.value === "All" ? "All" : Number(e.target.value)
              )
            }
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value="All">All Quarters</option>
            <option value={1}>Quarter 1</option>
            <option value={2}>Quarter 2</option>
            <option value={3}>Quarter 3</option>
            <option value={4}>Quarter 4</option>
          </select>

          {/* [COMPONENT] Criteria Filter */}
          <select
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
            value={selectedCriteria}
            onChange={(e) => setSelectedCriteria(e.target.value)}
          >
            <option value="All">All</option>
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* [COMPONENT] Lock / Unlock Button — only visible when a specific quarter is selected */}
          {filterQuarter !== "All" && (
            <button
              onClick={() => toggleQuarterLock(filterQuarter as number)}
              className={`sm:ml-auto px-4 py-2 rounded font-medium text-sm whitespace-nowrap ${
                quarterLocked[filterQuarter as number]
                  ? "bg-gray-400 text-white hover:bg-gray-500"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {quarterLocked[filterQuarter as number]
                ? `Q${filterQuarter} Locked`
                : `Lock Q${filterQuarter}`}
            </button>
          )}
        </div>

        {/* [SECTION] Grade Items Table */}
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
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-2 py-4 text-center text-gray-400"
                  >
                    No grade items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  // Lock status is per the item's own quarter, not the form's quarter
                  const itemLocked = !!quarterLocked[item.quarter];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td
                        className="px-2 py-2 truncate cursor-pointer"
                        title={item.displayLabel}
                      >
                        {item.displayLabel}
                      </td>
                      <td className="px-2 py-2 text-left">
                        {item.score != null
                          ? `${item.score} / ${item.maxScore}`
                          : "-"}
                      </td>
                      <td className="px-2 py-2 flex justify-center gap-2">
                        <button
                          className={`text-blue-600 font-medium ${
                            itemLocked ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => {
                            if (itemLocked) return;
                            setEditingItem(item);
                            setNewItemScore(item.score ?? "");
                            setNewItemMaxScore(item.maxScore);
                            setNewItemCriteria(item.criteria);
                            setSelectedQuarter(item.quarter);
                          }}
                          disabled={itemLocked}
                        >
                          Edit
                        </button>
                        <button
                          className={`text-red-600 font-medium ${
                            itemLocked ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => {
                            if (!itemLocked) confirmDeleteGradeItem(item.id);
                          }}
                          disabled={itemLocked}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* [SECTION] Add / Edit Grade Item Form */}
      <div className="bg-[var(--color-bg-100)] p-4 rounded-lg shadow space-y-3">
        <h4 className="font-medium">
          {editingItem ? "Edit Grade Item" : "Add New Grade Item"}
        </h4>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* [COMPONENT] Quarter Selector */}
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(Number(e.target.value))}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value={1}>Quarter 1</option>
            <option value={2}>Quarter 2</option>
            <option value={3}>Quarter 3</option>
            <option value={4}>Quarter 4</option>
          </select>

          {/* [COMPONENT] Criteria Selector */}
          <select
            value={newItemCriteria}
            onChange={(e) => setNewItemCriteria(e.target.value)}
            disabled={isLocked}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          >
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* [COMPONENT] Score Input */}
          <input
            type="number"
            placeholder="Score"
            value={newItemScore}
            onChange={(e) =>
              setNewItemScore(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            disabled={isLocked}
            min={0}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          />

          {/* [COMPONENT] Max Score Input */}
          <input
            type="number"
            placeholder="Max Score"
            value={newItemMaxScore}
            onChange={(e) =>
              setNewItemMaxScore(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            disabled={isLocked}
            min={1}
            className="font-roboto text-sm border border-[var(--color-bg-200)] bg-[var(--color-bg-50)] rounded px-3 py-2 w-full sm:w-auto"
          />

          {/* [COMPONENT] Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => (editingItem ? updateGradeItem() : createGradeItem())}
              disabled={isLocked}
              className={`px-4 py-1 rounded font-medium ${
                isLocked
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {editingItem ? "Update" : "Add"}
            </button>

            {editingItem && (
              <button
                onClick={resetForm}
                className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Locked hint for the selected form quarter */}
        {isLocked && (
          <p className="text-xs text-amber-600 font-medium">
            Quarter {selectedQuarter} is locked. Switch to a different quarter
            or unlock it from the filter above.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdviserClassStudentGradesDetails;