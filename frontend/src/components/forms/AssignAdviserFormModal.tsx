// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  email?: string;
}

interface AssignAdviserFormModalProps {
  isOpen: boolean;
  sectionName: string;
  currentAdviser?: { name: string; adviserId: string } | null;
  advisers: Adviser[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (adviserId: string, adviserName: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const AssignAdviserFormModal = ({
  isOpen,
  sectionName,
  currentAdviser,
  advisers,
  loading,
  onClose,
  onSubmit,
}: AssignAdviserFormModalProps) => {
  const [search, setSearch]                   = useState("");
  const [selectedAdviserId, setSelectedAdviserId] = useState("");
  const [selectedAdviserName, setSelectedAdviserName] = useState("");
  const [showDropdown, setShowDropdown]       = useState(false);
  const [formError, setFormError]             = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // ── Reset state every time the modal opens ────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedAdviserId("");
      setSelectedAdviserName("");
      setFormError("");
      setShowDropdown(false);
      // Auto-focus the search input after the modal mounts
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!isOpen) return null;

  // ── Filtered adviser list ─────────────────────────────────────────────────
  const filtered = advisers.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.adviserId.toLowerCase().includes(search.toLowerCase()) ||
      (a.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = (adviser: Adviser) => {
    setSelectedAdviserId(adviser.adviserId);
    setSelectedAdviserName(adviser.name);
    setSearch(adviser.name);
    setShowDropdown(false);
    setFormError("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Clear selection if the user edits after choosing
    if (selectedAdviserId) {
      setSelectedAdviserId("");
      setSelectedAdviserName("");
    }
    setShowDropdown(true);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!selectedAdviserId) {
      setFormError("Please select an adviser from the list.");
      return;
    }
    await onSubmit(selectedAdviserId, selectedAdviserName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setShowDropdown(false); }
    if (e.key === "Enter" && !showDropdown) { handleSubmit(); }
  };

  // ── Shared input style (mirrors SectionFormModal) ─────────────────────────
  const inputCls =
    "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[var(--color-bg-100)] rounded-lg p-6 w-full max-w-md shadow-lg">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-1 gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-900)]">Assign Adviser</h2>
            <p className="text-xs font-roboto text-[var(--color-text-500)] mt-0.5">
              Section: <span className="font-semibold text-[var(--color-text-700)]">{sectionName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[var(--color-text-400)] hover:text-[var(--color-text-700)] transition-colors mt-0.5 cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* ── Progress bar (single step, always full) ── */}
        <div className="flex gap-1.5 mb-5 mt-3">
          <div className="h-1 flex-1 rounded-full bg-[var(--color-primary-600)]" />
        </div>

        {/* ── Current adviser notice ── */}
        {currentAdviser && (
          <div className="mb-4 bg-[var(--color-bg-50)] border border-[var(--color-bg-300)] rounded-md px-3 py-2.5 flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-[var(--color-bg-300)] flex items-center justify-center text-[var(--color-text-600)] font-bold text-xs flex-shrink-0">
              {currentAdviser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-roboto text-[var(--color-text-500)]">Currently assigned</p>
              <p className="text-sm font-roboto font-semibold text-[var(--color-text-800)] truncate">
                {currentAdviser.name}
                <span className="ml-1.5 text-xs font-mono font-normal text-[var(--color-text-400)]">
                  #{currentAdviser.adviserId}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ── Adviser search ── */}
        <div className="flex flex-col gap-1 mb-2">
          <label className="font-roboto text-sm">
            Adviser <span className="text-[var(--color-red-500)]">*</span>
          </label>

          <div ref={dropdownRef} className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              className={inputCls}
              autoComplete="off"
            />

            {/* ── Dropdown list ── */}
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-bg-300)] rounded-md shadow-lg max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-[var(--color-text-400)] text-center">
                    No advisers found
                  </p>
                ) : (
                  filtered.map((adviser) => {
                    const isSelected = adviser.adviserId === selectedAdviserId;
                    const initials   = adviser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <button
                        key={adviser.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                        onClick={() => handleSelect(adviser)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors hover:bg-[var(--color-bg-100)] ${
                          isSelected
                            ? "bg-[var(--color-primary-50)] border-l-2 border-[var(--color-primary-500)]"
                            : ""
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`size-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                              : "bg-[var(--color-bg-200)] text-[var(--color-text-600)]"
                          }`}
                        >
                          {initials}
                        </div>
                        {/* Name + ID */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-roboto font-medium truncate ${
                            isSelected ? "text-[var(--color-primary-700)]" : "text-[var(--color-text-900)]"
                          }`}>
                            {adviser.name}
                          </p>
                          <p className="text-xs font-mono text-[var(--color-text-400)]">
                            #{adviser.adviserId}
                            {adviser.email && (
                              <span className="ml-2 font-sans not-italic text-[var(--color-text-400)]">
                                · {adviser.email}
                              </span>
                            )}
                          </p>
                        </div>
                        {/* Checkmark for selected */}
                        {isSelected && (
                          <svg className="size-4 text-[var(--color-primary-600)] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Selected adviser confirmation card ── */}
        {selectedAdviserId && (
          <div className="mt-3 bg-[var(--color-bg-50)] border border-[var(--color-primary-200)] rounded-md px-3 py-2.5 flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xs flex-shrink-0">
              {selectedAdviserName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-roboto text-[var(--color-text-500)]">Will be assigned</p>
              <p className="text-sm font-roboto font-semibold text-[var(--color-primary-700)] truncate">
                {selectedAdviserName}
              </p>
            </div>
            {/* Clear selection */}
            <button
              type="button"
              onClick={() => {
                setSelectedAdviserId("");
                setSelectedAdviserName("");
                setSearch("");
                inputRef.current?.focus();
              }}
              className="text-[var(--color-text-400)] hover:text-[var(--color-red-500)] transition-colors cursor-pointer"
              title="Clear selection"
            >
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Error message ── */}
        {formError && (
          <p className="text-[var(--color-red-500)] text-sm mt-3">{formError}</p>
        )}

        {/* ── Footer ── */}
        <div className="flex justify-between items-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-bg-200)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-300)] transition-colors text-sm disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedAdviserId}
            className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Assigning...
              </span>
            ) : (
              "Assign Adviser"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssignAdviserFormModal;