/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

// [IMPORT] Constants & Types
import type { Adviser, AdviserFormData, GeneralModalConfig } from "../../types";
import { AdviserFormModal } from "../../components/forms/AdviserFormModal";

const EMPTY_FORM: AdviserFormData = {
  adviserId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  password: "",
};

const AdminAdvisers = () => {
  const navigate = useNavigate();

  // [STATES] Entities
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search and Sort
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // [STATES] Adviser Form Modal
  const [showAdviserModal, setShowAdviserModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<AdviserFormData>(EMPTY_FORM);

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

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // * [FETCH] Advisers
  const fetchAdvisers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch advisers");
      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Advisers",
        message: "We couldn't load your advisers at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setAdvisers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisers();
  }, []);

  // [HANDLE] Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowSortFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // * [HANDLE] Open create modal
  const handleAddAdviser = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowAdviserModal(true);
  };

const handleSubmit = async () => {
  const payload = {
    adviserId: formData.adviserId.trim(),
    name: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" "),
    email: formData.email.trim(),
    password: formData.password.trim(),
  };

  setLoading(true);

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Operation failed");
    
    const failed = data.data?.failed || [];

    if (failed.length > 0) {
      throw new Error(failed[0].message || "Some advisers failed to create");
    }
    await fetchAdvisers();
    setShowAdviserModal(false);

    // Success
    openGeneralModal({
      title: "Adviser Created",
      message: `${formData.firstName} ${formData.lastName} has been added successfully.`,
      type: "success",
      confirmText: "Got it",
      isCancelable: false,
      onConfirm: () => closeGeneralModal(),
    });
  } catch (err: any) {
    // ! [ERROR] Show error modal
    console.error(err);;
    setShowAdviserModal(false);
    openGeneralModal({
      title: "Unable to Create Adviser",
      message: "Something went wrong while adding the adviser. Please try again.",
      type: "error",
      confirmText: "Close",
      isCancelable: false,
      onConfirm: () => closeGeneralModal(),
    });
  } finally {
    setLoading(false);
  }
};

  // [HANDLE] Sorting and Searching
  const filteredAdvisers = advisers
    .filter(a =>
      (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.adviserId && a.adviserId.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

  // [PAGINATION]
  const totalPages = Math.ceil(filteredAdvisers.length / itemsPerPage);
  const displayedAdvisers = filteredAdvisers.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Advisers", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  return (
    <div>
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
      {/* [MODAL] Adviser Form */}
      <AdviserFormModal
        isOpen={showAdviserModal}
        title="Add Adviser"
        onClose={() => setShowAdviserModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
      />

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">Advisers</h2>
          <nav className="font-roboto text-sm text-[var(--color-text-700)]">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx}>
                {crumb.path ? (
                  <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>{crumb.label}</span>
                ) : (
                  <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && " / "}
              </span>
            ))}
          </nav>
        </div>

        {/* [SECTION] Search & Filters */}
        <div className="bg-[var(--color-bg-100)] px-3 rounded-lg py-4 flex md:flex-row gap-2 md:gap-4 items-stretch w-full">
          {/* [INPUT] Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or adviser ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
            />
          </div>

          {/* [DROPDOWN] Sort Filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowSortFilters(!showSortFilters)}
              className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
            >
              <img src="/sort-icon.svg" alt="Sort" className="size-4" />
            </button>
            {showSortFilters && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
                <button onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}>Name ↑</button>
                <button onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}>Name ↓</button>
              </div>
            )}
          </div>
        </div>

        {/* [SECTION] Add Adviser */}
        <div className="mt-2 space-y-2">
          <PrimaryButton text="Add Adviser" iconSrc="/add-icon.svg" onClick={handleAddAdviser} />
        </div>

        {/* [CARDS] Advisers — Mobile View */}
        <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {/* [EMPTY STATE] No Advisers */}
          {!loading && (
            advisers.length === 0 ? (
              <EmptyState
                title="No advisers found"
                subtitle="No advisers have been added yet. Click 'Add Adviser' to get started."
                iconSrc="/no-data-icon.svg"
              />
            ) : displayedAdvisers.length === 0 ? (
              <EmptyState
                title="No advisers found"
                subtitle="No advisers match your current search. Try adjusting your criteria."
                iconSrc="/no-data-icon.svg"
              />
            ) : null
          )}
          {displayedAdvisers.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/admin/advisers/view/${a.id}`)}
            >
              <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
                <div className="flex items-center w-full gap-3 min-w-0">
                  <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border border-[var(--color-primary-200)] flex-shrink-0">
                    {a.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-roboto font-bold text-[var(--color-text-900)] text-base leading-tight truncate">{a.name}</p>
                    <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">#{a.adviserId}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Email</span>
                  <span className="text-[var(--color-text-900)] truncate text-right max-w-[200px]">{a.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Sections</span>
                  <span className="text-[var(--color-text-900)]">{a.sectionCount ?? 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* [TABLE] Advisers — Desktop View */}
        <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden">
          <table className="w-full text-sm font-roboto">
            <thead>
              <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Adviser</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Sections</th>
              </tr>
            </thead>
            <tbody>
              {displayedAdvisers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-600)]">No advisers found.</td>
                </tr>
              ) : (
                displayedAdvisers.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--color-bg-200)] hover:bg-[var(--color-bg-50)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/advisers/view/${a.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xs border border-[var(--color-primary-200)] flex-shrink-0">
                          {a.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-[var(--color-text-900)]">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-600)]">#{a.adviserId}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{a.email}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{a.sectionCount ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* [SECTION] Pagination */}
        {displayedAdvisers.length !== 0 && (
          <div className="flex justify-center items-center mt-4 gap-4">
            <button onClick={handlePrevPage} disabled={page === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${page === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"}`}>
              &lt;
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button key={num} onClick={() => setPage(num)}
                  className={`size-6 flex items-center justify-center rounded-full font-bold text-xs transition-all duration-150 ${num === page ? "size-7 bg-[var(--color-primary-500)] text-[var(--color-text-50)] scale-110" : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)]"}`}
                  aria-label={`Go to page ${num}`}>
                  {num}
                </button>
              ))}
            </div>
            <button onClick={handleNextPage} disabled={page === totalPages}
              className={`size-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${page === totalPages ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"}`}>
              &gt;
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminAdvisers;