/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import InputField from "../../components/toolbar/InputField";
import PageLayout from "../../components/layouts/PageLayout";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// *────────────────────────────────────────────────
// * TYPES
// *────────────────────────────────────────────────

// ? [INTERFACE] Quarter belonging to a school year
interface Quarter {
  id: number;
  name: number;         // 1 | 2 | 3 | 4
  startDate: string;    // ISO date string
  endDate: string;
}

// ? [INTERFACE] School year entity from API
interface SchoolYear {
  id: number;
  label: string;        // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
  quarters: Quarter[];
  createdAt: string;
  updatedAt: string;
}

// ? [INTERFACE] Form state for creating / editing a school year
interface SchoolYearForm {
  label: string;
  startDate: string;
  endDate: string;
  autoGenerateQuarters: boolean;
}

// ? [INTERFACE] Form state for editing a single quarter
interface QuarterForm {
  startDate: string;
  endDate: string;
}

type ModalMode = "create" | "edit" | "quarters" | null;

// *────────────────────────────────────────────────
// * HELPERS
// *────────────────────────────────────────────────

// [HELPER] Build default quarter date ranges from a school year's start/end
const buildDefaultQuarters = (startDate: string, endDate: string): Omit<Quarter, "id">[] => {
  const start = new Date(startDate);
  const end   = new Date(endDate);

  // [COMPUTE] Split the total duration into 4 roughly equal chunks
  const totalMs    = end.getTime() - start.getTime();
  const quarterMs  = totalMs / 4;

  return [1, 2, 3, 4].map((name) => {
    const qStart = new Date(start.getTime() + quarterMs * (name - 1));
    const qEnd   = new Date(start.getTime() + quarterMs * name - 1);
    return {
      name,
      startDate: qStart.toISOString().slice(0, 10),
      endDate:   qEnd.toISOString().slice(0, 10),
    };
  });
};

// [HELPER] Format ISO date string as readable date
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// [HELPER] Derive status label + badge style from a school year
const getStatusMeta = (sy: SchoolYear) => {
  if (sy.isLocked) return { label: "Locked",   style: "bg-[var(--color-bg-300)] text-[var(--color-text-500)]" };
  if (sy.isActive) return { label: "Active",   style: "bg-[var(--color-accent-100)] text-[var(--color-accent-700)]" };
  return              { label: "Inactive", style: "bg-amber-100 text-amber-700" };
};

// *────────────────────────────────────────────────
// * COMPONENT
// *────────────────────────────────────────────────

const AdminSchoolYears = () => {
  usePageTitle("Settings: School Years");

  // [STATES] Entities
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Modal mode + selected row
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedSY, setSelectedSY] = useState<SchoolYear | null>(null);

  // [STATES] Creation / edit form
  const [syForm, setSyForm] = useState<SchoolYearForm>({
    label: "",
    startDate: "",
    endDate: "",
    autoGenerateQuarters: true,
  });

  // [STATES] Quarter editing (keyed 1–4)
  const [quarterForms, setQuarterForms] = useState<Record<number, QuarterForm>>({});

  // [STATES] Submission loading flags
  const [savingForm, setSavingForm]   = useState(false);
  const [savingQtr, setSavingQtr]     = useState(false);
  const [actioning, setActioning]     = useState<string | null>(null); // "activate-{id}" | "lock-{id}" | "delete-{id}"

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: false,
    onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // *────────────────────────────────────────────────
  // * DATA FETCHING
  // *────────────────────────────────────────────────

  // * [HANDLE] Fetch all school years
  const fetchSchoolYears = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch school years");

      const data = await res.json();
      setSchoolYears(data.data ?? []);
    } catch (err) {
      // ! [ERROR] Fetch failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load School Years",
        message: "We couldn't load school years. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  // *────────────────────────────────────────────────
  // * MODAL HELPERS
  // *────────────────────────────────────────────────

  // [HANDLE] Open create form
  const openCreateModal = () => {
    setSyForm({ label: "", startDate: "", endDate: "", autoGenerateQuarters: true });
    setSelectedSY(null);
    setModalMode("create");
  };

  // [HANDLE] Open edit form pre-filled with existing data
  const openEditModal = (sy: SchoolYear) => {
    setSyForm({
      label:                  sy.label,
      startDate:              sy.startDate.slice(0, 10),
      endDate:                sy.endDate.slice(0, 10),
      autoGenerateQuarters:   false,
    });
    setSelectedSY(sy);
    setModalMode("edit");
  };

  // [HANDLE] Open quarter management for a school year
  const openQuartersModal = (sy: SchoolYear) => {
    setSelectedSY(sy);

    // [INIT] Seed form with existing quarter data (or empty placeholders)
    const initial: Record<number, QuarterForm> = {};
    [1, 2, 3, 4].forEach(q => {
      const existing = sy.quarters.find(qtr => qtr.name === q);
      initial[q] = {
        startDate: existing?.startDate?.slice(0, 10) ?? "",
        endDate:   existing?.endDate?.slice(0, 10)   ?? "",
      };
    });
    setQuarterForms(initial);
    setModalMode("quarters");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSY(null);
  };

  // *────────────────────────────────────────────────
  // * FORM HANDLERS
  // *────────────────────────────────────────────────

  // [HANDLE] SY form field change
  const handleSyFormChange = (field: keyof SchoolYearForm, value: string | boolean) => {
    setSyForm(prev => ({ ...prev, [field]: value }));
  };

  // [HANDLE] Quarter form field change
  const handleQuarterChange = (quarter: number, field: keyof QuarterForm, value: string) => {
    setQuarterForms(prev => ({
      ...prev,
      [quarter]: { ...prev[quarter], [field]: value },
    }));
  };

  // *────────────────────────────────────────────────
  // * SUBMIT HANDLERS
  // *────────────────────────────────────────────────

  // * [HANDLE] Create or Edit school year
  const handleSaveSchoolYear = async () => {
    const { label, startDate, endDate, autoGenerateQuarters } = syForm;

    // ! [VALIDATION] Required fields
    if (!label.trim() || !startDate || !endDate) {
      openGeneralModal({
        title: "Incomplete Fields",
        message: "Label, Start Date, and End Date are all required.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    // ! [VALIDATION] Date range
    if (new Date(startDate) >= new Date(endDate)) {
      openGeneralModal({
        title: "Invalid Date Range",
        message: "Start Date must be before End Date.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    const token   = localStorage.getItem("token");
    const isEdit  = modalMode === "edit";
    const url     = isEdit
      ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years/${selectedSY!.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years`;

    // [COMPUTE] Attach auto-generated quarters on creation if opted in
    const quarters = (!isEdit && autoGenerateQuarters)
      ? buildDefaultQuarters(startDate, endDate)
      : undefined;

    setSavingForm(true);
    try {
      const res = await fetch(url, {
        method:  isEdit ? "PATCH" : "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: label.trim(), startDate, endDate, quarters }),
      });

      const data = await res.json();

      if (!res.ok) {
        openGeneralModal({
          title:       isEdit ? "Update Failed" : "Creation Failed",
          message:     data.message || "An error occurred.",
          type:        "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm:   () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS]
      openGeneralModal({
        title:       isEdit ? "School Year Updated" : "School Year Created",
        message:     isEdit
          ? `"${label}" has been updated.`
          : `"${label}" has been created${autoGenerateQuarters ? " with default quarters" : ""}.`,
        type:        "success",
        confirmText: "Done",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });

      closeModal();
      await fetchSchoolYears();
    } catch (err) {
      // ! [ERROR] Network error
      console.error(err);
      openGeneralModal({
        title:       "Request Failed",
        message:     "Network error. Please try again.",
        type:        "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });
    } finally {
      setSavingForm(false);
    }
  };

  // * [HANDLE] Save quarter date ranges
  const handleSaveQuarters = async () => {
    if (!selectedSY) return;

    // ! [VALIDATION] All quarters must have both dates
    const hasGaps = [1, 2, 3, 4].some(
      q => !quarterForms[q]?.startDate || !quarterForms[q]?.endDate
    );
    if (hasGaps) {
      openGeneralModal({
        title:       "Incomplete Quarter Dates",
        message:     "All four quarters require both a start and end date.",
        type:        "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });
      return;
    }

    const token = localStorage.getItem("token");
    setSavingQtr(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years/${selectedSY.id}/quarters`,
        {
          method:  "PUT",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quarters: [1, 2, 3, 4].map(q => ({
              name:      q,
              startDate: quarterForms[q].startDate,
              endDate:   quarterForms[q].endDate,
            })),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        openGeneralModal({
          title:       "Save Failed",
          message:     data.message || "Could not save quarters.",
          type:        "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm:   () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS]
      openGeneralModal({
        title:       "Quarters Saved",
        message:     `Quarters for "${selectedSY.label}" have been updated.`,
        type:        "success",
        confirmText: "Done",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });
      closeModal();
      await fetchSchoolYears();
    } catch (err) {
      // ! [ERROR] Network error
      console.error(err);
      openGeneralModal({
        title:       "Request Failed",
        message:     "Network error. Please try again.",
        type:        "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });
    } finally {
      setSavingQtr(false);
    }
  };

  // * [HANDLE] Set a school year as Active
  const handleActivate = async (sy: SchoolYear) => {
    const actionKey = `activate-${sy.id}`;
    setActioning(actionKey);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years/${sy.id}`,
        {
          method:  "PATCH",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "activate" }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        openGeneralModal({
          title:       "Activation Failed",
          message:     data.message || "Could not activate this school year.",
          type:        "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm:   () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS]
      await fetchSchoolYears();
      openGeneralModal({
        title:       "School Year Activated",
        message:     `"${sy.label}" is now the active school year. The previous active year has been deactivated.`,
        type:        "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Network error
      console.error(err);
      openGeneralModal({
        title:       "Request Failed",
        message:     "Network error. Please try again.",
        type:        "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm:   () => closeGeneralModal(),
      });
    } finally {
      setActioning(null);
    }
  };

  // * [HANDLE] Lock a school year (irreversible)
  const handleLock = (sy: SchoolYear) => {
    openGeneralModal({
      title:       "Lock School Year?",
      message:     `Locking "${sy.label}" will permanently prevent any further edits. This cannot be undone.`,
      type:        "warning",
      confirmText: "Lock",
      isCancelable: true,
      onConfirm:   async () => {
        closeGeneralModal();
        const actionKey = `lock-${sy.id}`;
        setActioning(actionKey);
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years/${sy.id}`,
            {
              method:  "PATCH",
              headers: {
                Authorization:  `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ action: "lock" }),
            }
          );

          const data = await res.json();

          if (!res.ok) {
            openGeneralModal({
              title:       "Lock Failed",
              message:     data.message || "Could not lock this school year.",
              type:        "error",
              confirmText: "Close",
              isCancelable: false,
              onConfirm:   () => closeGeneralModal(),
            });
            return;
          }

          // * [SUCCESS]
          await fetchSchoolYears();
        } catch (err) {
          // ! [ERROR] Network error
          console.error(err);
          openGeneralModal({
            title:       "Request Failed",
            message:     "Network error. Please try again.",
            type:        "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm:   () => closeGeneralModal(),
          });
        } finally {
          setActioning(null);
        }
      },
    });
  };

  // * [HANDLE] Delete a school year
  const handleDelete = (sy: SchoolYear) => {
    openGeneralModal({
      title:       "Delete School Year?",
      message:     `Are you sure you want to delete "${sy.label}"? This action cannot be undone and will remove all associated quarter data.`,
      type:        "warning",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm:   async () => {
        closeGeneralModal();
        const actionKey = `delete-${sy.id}`;
        setActioning(actionKey);
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-years/${sy.id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
          );

          if (!res.ok) {
            const data = await res.json();
            openGeneralModal({
              title:       "Delete Failed",
              message:     data.message || "Could not delete this school year.",
              type:        "error",
              confirmText: "Close",
              isCancelable: false,
              onConfirm:   () => closeGeneralModal(),
            });
            return;
          }

          // * [SUCCESS]
          await fetchSchoolYears();
        } catch (err) {
          // ! [ERROR] Network error
          console.error(err);
          openGeneralModal({
            title:       "Request Failed",
            message:     "Network error. Please try again.",
            type:        "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm:   () => closeGeneralModal(),
          });
        } finally {
          setActioning(null);
        }
      },
    });
  };

  // *────────────────────────────────────────────────
  // * BREADCRUMBS
  // *────────────────────────────────────────────────

  // * [BREADCRUMBS] Admin School Years navigation
  const breadcrumbs = [
    { label: "Settings", path: "/admin/settings" },
    { label: "School Year Configuration", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  // *────────────────────────────────────────────────
  // * RENDER
  // *────────────────────────────────────────────────

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

      {/* [MODAL] Create / Edit School Year */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[var(--color-bg-50)] rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">

            {/* [HEADER] */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-roboto font-bold text-[var(--color-text-900)]">
                {modalMode === "create" ? "New School Year" : `Edit — ${selectedSY?.label}`}
              </h3>
              <button
                onClick={closeModal}
                className="text-[var(--color-text-500)] hover:text-[var(--color-text-900)] transition text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* [FIELDS] */}
            <div className="space-y-3">
              <InputField
                label="Label"
                type="text"
                placeholder="e.g. 2025-2026"
                value={syForm.label}
                onChange={e => handleSyFormChange("label", e.target.value)}
              />
              <InputField
                label="Start Date"
                type="date"
                value={syForm.startDate}
                onChange={e => handleSyFormChange("startDate", e.target.value)}
              />
              <InputField
                label="End Date"
                type="date"
                value={syForm.endDate}
                onChange={e => handleSyFormChange("endDate", e.target.value)}
              />

              {/* [TOGGLE] Auto-generate quarters — creation only */}
              {modalMode === "create" && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    id="autoQuarters"
                    type="checkbox"
                    checked={syForm.autoGenerateQuarters}
                    onChange={e => handleSyFormChange("autoGenerateQuarters", e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-primary-600)] cursor-pointer"
                  />
                  <label
                    htmlFor="autoQuarters"
                    className="text-sm font-roboto text-[var(--color-text-700)] cursor-pointer select-none"
                  >
                    Auto-generate Q1–Q4 date ranges
                  </label>
                </div>
              )}
            </div>

            {/* [ACTIONS] */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-md border border-[var(--color-bg-300)] text-sm font-roboto font-semibold text-[var(--color-text-700)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchoolYear}
                disabled={savingForm}
                className="flex-1 py-2.5 rounded-md bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-sm font-roboto font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingForm ? "Saving..." : modalMode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [MODAL] Quarter Date Management */}
      {modalMode === "quarters" && selectedSY && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[var(--color-bg-50)] rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">

            {/* [HEADER] */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-roboto font-bold text-[var(--color-text-900)]">
                Quarters — {selectedSY.label}
              </h3>
              <button
                onClick={closeModal}
                className="text-[var(--color-text-500)] hover:text-[var(--color-text-900)] transition text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* [FIELDS] One row per quarter */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map(q => (
                <div key={q} className="space-y-2">
                  <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                    Quarter {q}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Start Date"
                      type="date"
                      value={quarterForms[q]?.startDate ?? ""}
                      onChange={e => handleQuarterChange(q, "startDate", e.target.value)}
                    />
                    <InputField
                      label="End Date"
                      type="date"
                      value={quarterForms[q]?.endDate ?? ""}
                      onChange={e => handleQuarterChange(q, "endDate", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* [ACTIONS] */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-md border border-[var(--color-bg-300)] text-sm font-roboto font-semibold text-[var(--color-text-700)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuarters}
                disabled={savingQtr || selectedSY.isLocked}
                className="flex-1 py-2.5 rounded-md bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-sm font-roboto font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingQtr ? "Saving..." : "Save Quarters"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs
            items={breadcrumbs}
            title="School Year Configuration"
          />
        }
      >
        <div className="space-y-4">

          {/* [TOOLBAR] Header row + Create button */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-roboto text-[var(--color-text-500)]">
              Manage academic school years, set the active year, configure quarters, and lock completed years.
            </p>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-sm font-roboto font-bold text-white transition shrink-0 cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              New School Year
            </button>
          </div>

          {/* [TABLE / CARDS] School Years list */}
          <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
              All School Years
            </p>

            {schoolYears.length === 0 ? (
              <EmptyState
                title="No school years yet"
                subtitle="Create your first school year to get started."
              />
            ) : (
              <>
                {/* [TABLE] Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left">
                        <th className="table-header">Label</th>
                        <th className="table-header">Start Date</th>
                        <th className="table-header">End Date</th>
                        <th className="table-header text-center">Quarters</th>
                        <th className="table-header text-center">Status</th>
                        <th className="table-header text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolYears.map(sy => {
                        const { label: statusLabel, style: statusStyle } = getStatusMeta(sy);
                        const canEdit   = !sy.isLocked;
                        const canDelete = !sy.isActive && !sy.isLocked;

                        return (
                          <tr
                            key={sy.id}
                            className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition"
                          >
                            {/* Label */}
                            <td className="table-cell table-text">
                              <span className="font-roboto font-semibold text-sm text-[var(--color-text-900)]">
                                {sy.label}
                              </span>
                            </td>

                            {/* Start Date */}
                            <td className="table-cell table-text table-text-default">
                              {formatDate(sy.startDate)}
                            </td>

                            {/* End Date */}
                            <td className="table-cell table-text table-text-default">
                              {formatDate(sy.endDate)}
                            </td>

                            {/* Quarters */}
                            <td className="table-cell table-text text-center">
                              <button
                                onClick={() => openQuartersModal(sy)}
                                className="text-xs font-roboto font-semibold text-[var(--color-primary-600)] hover:underline cursor-pointer"
                              >
                                {sy.quarters.length > 0
                                  ? `${sy.quarters.length} / 4 configured`
                                  : "Set up quarters"}
                              </button>
                            </td>

                            {/* Status */}
                            <td className="table-cell table-text text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle}`}>
                                {statusLabel}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="table-cell table-text">
                              <div className="flex items-center justify-center gap-2 flex-wrap">

                                {/* Set as Active */}
                                {!sy.isActive && !sy.isLocked && (
                                  <button
                                    onClick={() => handleActivate(sy)}
                                    disabled={actioning === `activate-${sy.id}`}
                                    className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-[var(--color-accent-100)] text-[var(--color-accent-700)] hover:bg-[var(--color-accent-200)] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    {actioning === `activate-${sy.id}` ? "Setting..." : "Set Active"}
                                  </button>
                                )}

                                {/* Edit */}
                                {canEdit && (
                                  <button
                                    onClick={() => openEditModal(sy)}
                                    className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-[var(--color-bg-200)] text-[var(--color-text-800)] hover:bg-[var(--color-bg-300)] transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}

                                {/* Lock */}
                                {!sy.isLocked && (
                                  <button
                                    onClick={() => handleLock(sy)}
                                    disabled={actioning === `lock-${sy.id}`}
                                    className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    {actioning === `lock-${sy.id}` ? "Locking..." : "Lock"}
                                  </button>
                                )}

                                {/* Delete */}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(sy)}
                                    disabled={actioning === `delete-${sy.id}`}
                                    className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    {actioning === `delete-${sy.id}` ? "Deleting..." : "Delete"}
                                  </button>
                                )}

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* [CARDS] Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-3">
                  {schoolYears.map(sy => {
                    const { label: statusLabel, style: statusStyle } = getStatusMeta(sy);
                    const canEdit   = !sy.isLocked;
                    const canDelete = !sy.isActive && !sy.isLocked;

                    return (
                      <div
                        key={sy.id}
                        className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 space-y-3"
                      >
                        {/* [HEADER] Label + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-roboto font-bold text-sm text-[var(--color-text-900)]">
                            {sy.label}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* [INFO] Dates */}
                        <div className="text-xs font-roboto text-[var(--color-text-600)] space-y-0.5">
                          <p>Start: {formatDate(sy.startDate)}</p>
                          <p>End: {formatDate(sy.endDate)}</p>
                        </div>

                        {/* [LINK] Quarters */}
                        <button
                          onClick={() => openQuartersModal(sy)}
                          className="text-xs font-roboto font-semibold text-[var(--color-primary-600)] hover:underline cursor-pointer"
                        >
                          {sy.quarters.length > 0
                            ? `${sy.quarters.length} / 4 quarters configured`
                            : "Set up quarters →"}
                        </button>

                        {/* [ACTIONS] */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--color-bg-200)]">
                          {!sy.isActive && !sy.isLocked && (
                            <button
                              onClick={() => handleActivate(sy)}
                              disabled={actioning === `activate-${sy.id}`}
                              className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-[var(--color-accent-100)] text-[var(--color-accent-700)] hover:bg-[var(--color-accent-200)] transition disabled:opacity-50 cursor-pointer"
                            >
                              {actioning === `activate-${sy.id}` ? "Setting..." : "Set Active"}
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(sy)}
                              className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-[var(--color-bg-200)] text-[var(--color-text-800)] hover:bg-[var(--color-bg-300)] transition cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {!sy.isLocked && (
                            <button
                              onClick={() => handleLock(sy)}
                              disabled={actioning === `lock-${sy.id}`}
                              className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-50 cursor-pointer"
                            >
                              {actioning === `lock-${sy.id}` ? "Locking..." : "Lock"}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(sy)}
                              disabled={actioning === `delete-${sy.id}`}
                              className="text-xs px-2.5 py-1 rounded-md font-roboto font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50 cursor-pointer"
                            >
                              {actioning === `delete-${sy.id}` ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* [INFO] Business rules reference */}
          <div className="bg-[var(--color-bg-100)] px-4 py-3 rounded-lg">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-2">
              Rules
            </p>
            <ul className="space-y-1 text-xs font-roboto text-[var(--color-text-500)]">
              <li>• Only one school year can be <span className="font-semibold text-[var(--color-accent-700)]">Active</span> at a time. Activating a year automatically deactivates the previous one.</li>
              <li>• <span className="font-semibold text-[var(--color-text-700)]">Locked</span> school years cannot be modified or deleted.</li>
              <li>• <span className="font-semibold text-red-600">Active</span> school years cannot be deleted — lock or deactivate first.</li>
              <li>• Quarters drive SF9 grading logic (Q1–Q4 readiness) and enrollment filtering.</li>
            </ul>
          </div>

        </div>
      </PageLayout>
    </>
  );
};

export default AdminSchoolYears;