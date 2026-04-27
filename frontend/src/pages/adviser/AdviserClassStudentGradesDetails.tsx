/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/Skeleton";
import ProfileInfo from "../../components/ProfileInfo";
import Breadcrumbs from "../../components/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// ? [INTERFACE] Grade item from API
interface GradeItemApi {
  id: number;
  type: string;
  score: number | null;
  maxScore?: number;
  createdAt?: string;
  quarter?: number;
}

// ? [INTERFACE] Subject grade from API
interface SubjectGradeApi {
  id: number;
  learningArea?: { name: string };
  items?: GradeItemApi[];
}

// ? [INTERFACE] Grading item for the UI
interface GradingItem {
  id: number;
  criteria: string;
  score: number | null;
  maxScore: number;
  createdAt?: string;
  quarter: number;
  displayLabel?: string;
}

// ? [INTERFACE] Full subject grade detail
interface SubjectGradeDetail {
  id: number;
  subject: string;
  gradingItems: GradingItem[];
}

// ? [INTERFACE] Advisory section summary
interface AdvisorySection {
  gradeLevel: string;
  name: string;
}

// [CONSTANT] Abbreviations for criteria display labels
const CRITERIA_ABBREVIATIONS: Record<string, string> = {
  WRITTEN_WORK: "WW",
  PERFORMANCE_TASK: "PT",
  QUARTERLY_ASSESSMENT: "QA",
};

// [CONSTANT] Subject display abbreviations
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

// [CONSTANT] Full criteria labels for selects
const CRITERIA_LABELS: Record<string, string> = {
  WRITTEN_WORK: "Written Works",
  PERFORMANCE_TASK: "Performance Tasks",
  QUARTERLY_ASSESSMENT: "Quarterly Assessment",
};

// [HELPER] Assign sequential display labels per criteria per quarter
// e.g. "WW 1", "WW 2", "PT 1", "QA" (QA has no sequence number)
const buildNumberedItems = (items: GradingItem[]): GradingItem[] => {
  const counters: Record<string, number> = {};
  return items.map(item => {
    const key = `${item.criteria}-${item.quarter}`;
    counters[key] = (counters[key] ?? 0) + 1;
    const abbrev = CRITERIA_ABBREVIATIONS[item.criteria] ?? item.criteria;
    const displayLabel =
      item.criteria === "WRITTEN_WORK" || item.criteria === "PERFORMANCE_TASK"
        ? `${abbrev} ${counters[key]}`
        : abbrev;
    return { ...item, displayLabel };
  });
};

// [CONSTANT] Input class shared across form fields
const INPUT_CLS = "input-base font-roboto text-sm w-full sm:w-auto";

const AdviserClassStudentGradesDetails = () => {
  const { sectionId, studentId, subjectId } = useParams<{
    sectionId: string;
    studentId: string;
    subjectId: string;
  }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [grade, setGrade] = useState<SubjectGradeDetail | null>(null);
  const [profileName, setProfileName] = useState("");
  const [advisorySection, setAdvisorySection] = useState<AdvisorySection | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Filter
  const [filterQuarter, setFilterQuarter] = useState<number | "All">("All");
  const [selectedCriteria, setSelectedCriteria] = useState<string>("All");

  // [STATES] Add / Edit Form
  const [editingItem, setEditingItem] = useState<GradingItem | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [newItemScore, setNewItemScore] = useState<number | "">("");
  const [newItemMaxScore, setNewItemMaxScore] = useState<number | "">(100);
  const [newItemCriteria, setNewItemCriteria] = useState<string>("WRITTEN_WORK");

  // [STATES] Quarter lock — keyed by quarter number
  const [quarterLocked, setQuarterLocked] = useState<Record<number, boolean>>({});

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: true,
    onConfirm: () => {},
  });

  /**
   * Use a ref for pending modal actions instead of state.
   * React's setState(fn) treats fn as an updater and calls it immediately —
   * storing an async function via setState would invoke it. A ref avoids this.
   */
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);

  const token = localStorage.getItem("token");

  // [COMPUTE] Per-quarter status for the indicator row
  const quarterStatus: Record<number, { hasGrades: boolean; locked: boolean }> =
    [1, 2, 3, 4].reduce((acc, q) => {
      const items = grade?.gradingItems.filter(item => item.quarter === q) ?? [];
      acc[q] = { hasGrades: items.length > 0, locked: !!quarterLocked[q] };
      return acc;
    }, {} as Record<number, { hasGrades: boolean; locked: boolean }>);

  // [COMPUTE] Lock state for the currently selected form quarter
  const isLocked = !!quarterLocked[selectedQuarter];

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
    pendingActionRef.current = null;
  };

  const handleModalConfirm = async () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      await action();
    }
  };

  // * [HANDLE] Fetch Student Info + SF9 Grades
  const fetchGradeDetails = useCallback(async () => {
    if (!sectionId || !studentId || !subjectId) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const studentData = await res.json();
      if (!studentData?.success || !studentData.data) throw new Error(studentData?.message || "Failed to fetch student");

      const s = studentData.data;
      setProfileName(s.fullName ?? "");
      setAdvisorySection({ gradeLevel: String(s.gradeLevel), name: s.sectionName });

      const gradesArray: SubjectGradeApi[] = Array.isArray(s.sf9Grades) ? s.sf9Grades : [];
      if (gradesArray.length === 0) throw new Error("No SF9 grades found for this student");

      const subjectGradeData = gradesArray.find(g => g?.id === Number(subjectId));
      if (!subjectGradeData) throw new Error("Subject grade not found");

      // [SORT] Items by createdAt then id for deterministic numbering
      const sortedItems: GradingItem[] = (subjectGradeData.items ?? [])
        .slice()
        .sort((a, b) => {
          if (a.createdAt && b.createdAt)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return a.id - b.id;
        })
        .map(item => ({
          id: item.id,
          criteria: item.type,
          score: item.score,
          maxScore: item.maxScore ?? 100,
          createdAt: item.createdAt,
          quarter: item.quarter ?? 1,
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

      // [FETCH] Quarter lock status using the SF9 grade ID
      try {
        const lockRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/${gradeId}/quarter-status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lockData = await lockRes.json();
        if (lockData?.success) setQuarterLocked(lockData.data ?? {});
      } catch (lockErr) {
        console.warn("Failed to fetch quarter status", lockErr);
      }
    } catch (err) {
      // ! [ERROR] Fetching grade details failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Grades",
        message: "We couldn't load the grade details. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setGrade(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, studentId, subjectId, token]);

  useEffect(() => {
    fetchGradeDetails();
  }, [fetchGradeDetails]);

  // * [HANDLE] Toggle Quarter Lock / Unlock
  const toggleQuarterLock = async (quarter: number) => {
    if (!grade?.id) return;

    const quarterItems = grade.gradingItems.filter(item => item.quarter === quarter);
    if (quarterItems.length === 0) {
      openGeneralModal({
        title: "Cannot Lock Quarter",
        message: `Quarter ${quarter} has no grade items. Add at least one item before locking.`,
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    const isCurrentlyLocked = !!quarterLocked[quarter];

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/${grade.id}/quarter-ready`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ quarter: `q${quarter}`, ready: !isCurrentlyLocked }),
        }
      );
      const data = await res.json();

      if (!data?.success) throw new Error(data?.message || "Unknown error");

      const newLockValue: boolean = data.data[`q${quarter}Ready`] ?? !isCurrentlyLocked;
      setQuarterLocked(prev => ({ ...prev, [quarter]: newLockValue }));

      // * [SUCCESS] Quarter lock toggled
      openGeneralModal({
        title: newLockValue ? "Quarter Locked" : "Quarter Unlocked",
        message: `Quarter ${quarter} has been ${newLockValue ? "locked" : "unlocked"} successfully.`,
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Quarter lock toggle failed
      console.error(err);
      openGeneralModal({
        title: "Action Failed",
        message: `Failed to ${isCurrentlyLocked ? "unlock" : "lock"} Quarter ${quarter}. Please try again.`,
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    }
  };

  // [HANDLE] Shared validation for score inputs
  const validateScores = (score: number | "", maxScore: number | ""): string | null => {
    if (score === "" || maxScore === "") return "Please enter a score and max score.";
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

  // * [HANDLE] Create Grade Item
  const createGradeItem = async () => {
    if (!grade) return;

    const validationError = validateScores(newItemScore, newItemMaxScore);
    if (validationError) {
      openGeneralModal({ title: "Validation Error", message: validationError, type: "error", isCancelable: false, onConfirm: () => closeGeneralModal() });
      return;
    }

    if (!newItemCriteria) {
      openGeneralModal({ title: "Validation Error", message: "Please select a criteria.", type: "error", isCancelable: false, onConfirm: () => closeGeneralModal() });
      return;
    }

    // ! [VALIDATION] Duplicate QA guard
    if (newItemCriteria === "QUARTERLY_ASSESSMENT") {
      const existingQA = grade.gradingItems.find(
        item => item.criteria === "QUARTERLY_ASSESSMENT" && item.quarter === selectedQuarter
      );
      if (existingQA) {
        openGeneralModal({
          title: "Duplicate Quarterly Assessment",
          message: `A Quarterly Assessment already exists for Quarter ${selectedQuarter}. You cannot add another.`,
          type: "error",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }
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
          maxScore: Number(newItemMaxScore),
        }),
      });
      const data = await res.json();

      if (!data?.success) throw new Error(data?.message || "Failed to add grade item");

      resetForm();
      if (data.data) {
        const newItem: GradingItem = {
          id: data.data.id,
          criteria: data.data.type,
          score: data.data.score,
          maxScore: data.data.maxScore ?? 100,
          createdAt: data.data.createdAt,
          quarter: data.data.quarter ?? selectedQuarter,
        };
        setGrade(prev => prev ? { ...prev, gradingItems: [...prev.gradingItems, newItem] } : prev);
      }
      await fetchGradeDetails();
    } catch (err) {
      // ! [ERROR] Create grade item failed
      console.error(err);
      openGeneralModal({ title: "Error", message: "Failed to add grade item. Please try again.", type: "error", isCancelable: false, onConfirm: () => closeGeneralModal() });
    }
  };

  // * [HANDLE] Update Grade Item (shows confirmation modal first)
  const updateGradeItem = () => {
    if (!editingItem) return;

    const validationError = validateScores(newItemScore, newItemMaxScore);
    if (validationError) {
      openGeneralModal({ title: "Validation Error", message: validationError, type: "error", isCancelable: false, onConfirm: () => closeGeneralModal() });
      return;
    }

    // ! [VALIDATION] Duplicate QA guard — exclude the item being edited
    if (newItemCriteria === "QUARTERLY_ASSESSMENT") {
      const existingQA = grade?.gradingItems.find(
        item => item.criteria === "QUARTERLY_ASSESSMENT" && item.quarter === selectedQuarter && item.id !== editingItem.id
      );
      if (existingQA) {
        openGeneralModal({
          title: "Duplicate Quarterly Assessment",
          message: `A Quarterly Assessment already exists for Quarter ${selectedQuarter}.`,
          type: "error",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }
    }

    pendingActionRef.current = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item/${editingItem.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              quarter: selectedQuarter,
              type: newItemCriteria,
              score: Number(newItemScore),
              maxScore: Number(newItemMaxScore),
            }),
          }
        );
        const data = await res.json();

        if (!data?.success) throw new Error(data?.message || "Failed to update grade item");

        resetForm();
        setGrade(prev =>
          prev
            ? {
                ...prev,
                gradingItems: prev.gradingItems.map(item =>
                  item.id === editingItem.id
                    ? { ...item, criteria: newItemCriteria, score: Number(newItemScore), maxScore: Number(newItemMaxScore), quarter: selectedQuarter }
                    : item
                ),
              }
            : prev
        );
        await fetchGradeDetails();

        // * [SUCCESS] Grade item updated
        openGeneralModal({ title: "Updated", message: "Grade item updated successfully.", type: "success", isCancelable: false, onConfirm: () => closeGeneralModal() });
      } catch (err) {
        // ! [ERROR] Update grade item failed
        console.error(err);
        openGeneralModal({ title: "Error", message: "Failed to update grade item. Please try again.", type: "error", isCancelable: false, onConfirm: () => closeGeneralModal() });
      }
    };

    openGeneralModal({
      title: "Confirm Update",
      message: "Are you sure you want to update this grade item?",
      type: "info",
      isCancelable: true,
      onConfirm: handleModalConfirm,
    });
  };

  // * [HANDLE] Delete Grade Item (shows confirmation modal first)
  const confirmDeleteGradeItem = (id: number) => {
    pendingActionRef.current = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/sf9/item`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ itemIds: [id] }),
        });
        const data = await res.json();

        if (!data?.success) throw new Error(data?.message || "Failed to delete item");

        setGrade(prev =>
          prev ? { ...prev, gradingItems: prev.gradingItems.filter(item => item.id !== id) } : prev
        );
        await fetchGradeDetails();
      } catch (err) {
        // ! [ERROR] Delete grade item failed
        console.error(err);
        openGeneralModal({ title: "Error", message: "Failed to delete item. Please try again.", type: "error", isCancelable: false, onConfirm: () => closeGeneralModal() });
      }
    };

    openGeneralModal({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this grade item?",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: handleModalConfirm,
    });
  };

  // [COMPUTE] Build display labels then apply filters
  const numberedItems = buildNumberedItems(grade?.gradingItems ?? []);
  const filteredItems = numberedItems.filter(item => {
    const quarterMatch = filterQuarter === "All" || item.quarter === filterQuarter;
    const criteriaMatch = selectedCriteria === "All" || item.criteria === selectedCriteria;
    return quarterMatch && criteriaMatch;
  });

  // * [BREADCRUMBS] Adviser Student Grade Details navigation
  const breadcrumbs = [
    { label: "Adviser Dashboard", path: "/adviser/dashboard" },
    { label: "Class Management", path: "/adviser/classes" },
    {
      label: advisorySection ? `${advisorySection.gradeLevel} — ${advisorySection.name}` : "Section",
      path: `/adviser/classes/${sectionId}`,
    },
    { label: "Grades", path: `/adviser/classes/${sectionId}/grades` },
    { label: profileName || "Student", path: `/adviser/classes/${sectionId}/grades/${studentId}` },
    { label: grade?.subject ?? "Subject", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  // [COMPUTE] Split name for ProfileInfo
  const nameParts = profileName.trim().split(" ");
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ") || firstName;

  return (
    <>
      {/* [MODAL] General */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
        isCancelable={generalModal.isCancelable}
      />

      {/* [LAYOUT] Adviser Page */}
      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="Subject Grades" />}
      >
        {grade ? (
          <div className="space-y-4">

            {/* [COMPONENT] Profile Info */}
            <ProfileInfo lastName={lastName} firstName={firstName} />

            {/* [CARD] Quarter Status Indicators */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-3">
                Quarter Status
              </p>
              <div className="flex justify-around gap-2">
                {[1, 2, 3, 4].map(q => {
                  const status = quarterStatus[q];
                  const { dot, label } = status.locked && status.hasGrades
                    ? { dot: "bg-[var(--color-accent-600)]", label: "Locked" }
                    : status.hasGrades
                    ? { dot: "bg-amber-400", label: "Has Grades" }
                    : { dot: "bg-[var(--color-red-500)]", label: "No Grades" };

                  return (
                    <div key={q} className="flex flex-col items-center gap-1">
                      <div className={`size-5 rounded-full ${dot}`} />
                      <span className="text-sm font-semibold font-roboto">Q{q}</span>
                      <span className="text-xs text-[var(--color-text-600)]">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* [CARD] Filters + Lock Button + Grade Items Table */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [TOOLBAR] Quarter filter + Criteria filter + Lock button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <select
                  value={filterQuarter}
                  onChange={e => setFilterQuarter(e.target.value === "All" ? "All" : Number(e.target.value))}
                  className={INPUT_CLS}
                >
                  <option value="All">All Quarters</option>
                  {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quarter {q}</option>)}
                </select>

                <select
                  value={selectedCriteria}
                  onChange={e => setSelectedCriteria(e.target.value)}
                  className={INPUT_CLS}
                >
                  <option value="All">All Criteria</option>
                  {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                {/* [BUTTON] Lock / Unlock — always visible, disabled when no quarter selected */}
                <button
                  onClick={() => filterQuarter !== "All" && toggleQuarterLock(filterQuarter as number)}
                  disabled={filterQuarter === "All"}
                  className={`sm:ml-auto px-4 py-2 rounded-md font-roboto font-semibold text-sm whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    filterQuarter !== "All" && quarterLocked[filterQuarter as number]
                      ? "bg-[var(--color-bg-300)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-400)]"
                      : "bg-[var(--color-accent-600)] text-white hover:bg-[var(--color-accent-700)]"
                  }`}
                >
                  {filterQuarter === "All"
                    ? "Lock Quarter"
                    : quarterLocked[filterQuarter as number]
                    ? `Unlock Q${filterQuarter}`
                    : `Lock Q${filterQuarter}`}
                </button>
              </div>

              {/* [SECTION] Grade Items Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left">
                      <th className="table-header">Criteria</th>
                      <th className="table-header">Score</th>
                      <th className="table-header text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="table-cell table-text table-text-default text-center py-4">
                          No grade items found.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const itemLocked = !!quarterLocked[item.quarter];
                        return (
                          <tr key={item.id} className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition">
                            <td className="table-cell table-text table-text-default" title={item.displayLabel}>
                              {item.displayLabel}
                            </td>
                            <td className="table-cell table-text table-text-default">
                              {item.score != null ? `${item.score} / ${item.maxScore}` : "—"}
                            </td>
                            <td className="table-cell table-text">
                              <div className="flex justify-center gap-3">
                                <button
                                  disabled={itemLocked}
                                  onClick={() => {
                                    if (itemLocked) return;
                                    setEditingItem(item);
                                    setNewItemScore(item.score ?? "");
                                    setNewItemMaxScore(item.maxScore);
                                    setNewItemCriteria(item.criteria);
                                    setSelectedQuarter(item.quarter);
                                  }}
                                  className="text-xs font-roboto font-semibold text-[var(--color-primary-600)] hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  disabled={itemLocked}
                                  onClick={() => { if (!itemLocked) confirmDeleteGradeItem(item.id); }}
                                  className="text-xs font-roboto font-semibold text-[var(--color-red-600)] hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* [CARD] Add / Edit Grade Item Form */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                {editingItem ? "Edit Grade Item" : "Add Grade Item"}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* [FIELD] Quarter Selector */}
                <select
                  value={selectedQuarter}
                  onChange={e => setSelectedQuarter(Number(e.target.value))}
                  className={INPUT_CLS}
                >
                  {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quarter {q}</option>)}
                </select>

                {/* [FIELD] Criteria Selector */}
                <select
                  value={newItemCriteria}
                  onChange={e => setNewItemCriteria(e.target.value)}
                  disabled={isLocked}
                  className={INPUT_CLS}
                >
                  {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                {/* [FIELD] Score Input */}
                <input
                  type="number"
                  placeholder="Score"
                  value={newItemScore}
                  onChange={e => setNewItemScore(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={isLocked}
                  min={0}
                  className={INPUT_CLS}
                />

                {/* [FIELD] Max Score Input */}
                <input
                  type="number"
                  placeholder="Max Score"
                  value={newItemMaxScore}
                  onChange={e => setNewItemMaxScore(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={isLocked}
                  min={1}
                  className={INPUT_CLS}
                />

                {/* [BUTTONS] Submit + Cancel */}
                <div className="flex gap-2">
                  <button
                    onClick={() => editingItem ? updateGradeItem() : createGradeItem()}
                    disabled={isLocked}
                    className="px-4 py-2 rounded-md font-roboto font-semibold text-sm text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {editingItem ? "Update" : "Add"}
                  </button>
                  {editingItem && (
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 rounded-md font-roboto font-semibold text-sm bg-[var(--color-bg-200)] hover:bg-[var(--color-bg-300)] text-[var(--color-text-700)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* [HINT] Locked quarter warning */}
              {isLocked && (
                <p className="text-xs font-roboto text-amber-600 font-medium">
                  Quarter {selectedQuarter} is locked. Switch to a different quarter or unlock it above.
                </p>
              )}
            </div>

          </div>
        ) : (
          // [EMPTY STATE] Grade not found
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Grade not available.</p>
            <button
              onClick={() => navigate(`/adviser/classes/${sectionId}/grades`)}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Grades
            </button>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default AdviserClassStudentGradesDetails;