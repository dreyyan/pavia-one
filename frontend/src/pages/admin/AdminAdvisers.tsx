/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import Dropdown from "../../components/Dropdown";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import Breadcrumbs from "../../components/Breadcrumbs";
import AdviserCard from "../../components/cards/AdviserCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import AdviserFormModal from "../../components/forms/AdviserFormModal";
import AdminPageLayout from "../../components/layouts/AdminPageLayout";

// [IMPORT] Helpers & Types
import { getVisiblePages, getLastName } from "../../helpers/index";
import { Adviser, AdviserFormData, GeneralModalConfig } from "../../types";

// [CONSTANT] Empty form state
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

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "filter" | null>(null);

  type SortOption = "name-asc" | "name-desc";
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const [sectionsFilter, setSectionsFilter] = useState<string[]>([]);

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
    setGeneralModal({
      ...generalModal,
      isOpen: true,
      ...config,
    });
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // [EFFECT] Update items per page based on screen width (responsive design)
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;

      if (width < 768) setItemsPerPage(5);        // xs (cards)
      else if (width < 1024) setItemsPerPage(6);  // md (cards)
      else if (width < 1280) setItemsPerPage(8);  // lg (table)
      else if (width < 1536) setItemsPerPage(10); // xl (table)
      else setItemsPerPage(12);                   // 2xl (table)
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // * [HANDLE] Fetch Advisers
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
      // ! [ERROR] Fetching advisers failed
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

  // * [HANDLE] Open Create Modal
  const handleAddAdviser = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowAdviserModal(true);
  };

  // * [HANDLE] Submit Create Form
  const handleSubmit = async () => {
    const payload = {
      adviserId: formData.adviserId.trim(),
      name: [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(" "),
      email: formData.email.trim(),
      password: formData.password?.trim(),
    };

    setLoading(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // [HANDLE] Backend validation / business errors
      if (!data.success) {
        const errorMsg =
          data.message ||
          data.data?.failed?.[0]?.message ||
          "Operation failed";
        throw new Error(errorMsg);
      }

      const failed = data.data?.failed || [];
      if (failed.length > 0) {
        throw new Error(failed[0].message || "Some advisers failed to create");
      }

      await fetchAdvisers();
      setShowAdviserModal(false);

      // * [SUCCESS] Adviser Created
      openGeneralModal({
        title: "Adviser Created",
        message: `${formData.firstName} ${formData.lastName} has been added successfully.`,
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Create Adviser Failed
      console.error("Submit error:", err);
      const errorMessage = err.message || "An unexpected error occurred while saving the adviser.";
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Sorting, Searching & Filtering
  const filteredAdvisers = advisers
    .filter(a => {
      const matchesSearch =
        (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
        (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
        (a.adviserId && a.adviserId.toLowerCase().includes(search.toLowerCase()));

      const sectionCount = a.sectionCount ?? 0;
      const matchesSections =
        sectionsFilter.length === 0 ||
        (sectionsFilter.includes("with-sections") && sectionCount > 0) ||
        (sectionsFilter.includes("no-sections") && sectionCount === 0);

      return matchesSearch && matchesSections;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": {
          const last = getLastName(a.name || "").localeCompare(getLastName(b.name || ""));
          return last !== 0 ? last : (a.name || "").localeCompare(b.name || "");
        }
        case "name-desc": {
          const last = getLastName(b.name || "").localeCompare(getLastName(a.name || ""));
          return last !== 0 ? last : (b.name || "").localeCompare(a.name || "");
        }
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredAdvisers.length / itemsPerPage);
  const displayedAdvisers = filteredAdvisers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // * [BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Advisers", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

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

      {/* [MODAL] Adviser Form */}
      <AdviserFormModal
        isOpen={showAdviserModal}
        title="Create Adviser"
        onClose={() => setShowAdviserModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
      />

      {/* [LAYOUT] Admin Page */}
      <AdminPageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Advisers" />
        }
        toolbar={
          <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 md:gap-4 w-full">
                {/* [COMPONENT] Search Bar */}
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={search}
                    placeholder="Search by name, email, or adviser ID..."
                    onChange={setSearch}
                    onResetPage={() => setPage(1)}
                  />
                </div>

                {/* [COMPONENT] Sort & Filter Dropdowns */}
                <div className="flex gap-x-2 ml-auto shrink-0">
                  <Dropdown
                    icon="/sort.svg"
                    label="Sort"
                    isOpen={activeDropdown === "sort"}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === "sort" ? null : "sort")
                    }
                    selected={sortOption}
                    onSelect={(value) => {
                      setSortOption(value as SortOption);
                      setPage(1);
                    }}
                    options={[
                      { label: "Name (A → Z)", value: "name-asc" },
                      { label: "Name (Z → A)", value: "name-desc" },
                    ]}
                  />

                  {/* [COMPONENT] Filter Dropdown */}
                  <Dropdown
                    icon="/filter.svg"
                    label="Filter"
                    isOpen={activeDropdown === "filter"}
                    onToggle={() =>
                      setActiveDropdown(activeDropdown === "filter" ? null : "filter")
                    }
                    width="w-44"
                    selectedValues={sectionsFilter}
                    onSelectMultiple={(v) => { setSectionsFilter(v); setPage(1); }}
                    options={[
                      { label: "With Sections", value: "with-sections" },
                      { label: "No Sections", value: "no-sections" },
                    ]}
                  />
                </div>
              </div>

              {/* [PRIMARY BUTTON] Add Adviser */}
              <div className="w-full md:w-auto md:ml-auto">
                <PrimaryButton
                  text="Add Adviser"
                  iconSrc="/add.svg"
                  onClick={handleAddAdviser}
                  className="w-full md:w-auto"
                />
              </div>
            </div>
          </div>
        }
        footer={
          // [COMPONENT] Pagination
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            getVisiblePages={getVisiblePages}
          />
        }>
        <div className="space-y-3">

          {/* [SECTION] Adviser Cards (Mobile View) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {!loading && displayedAdvisers.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No advisers found"
                  subtitle="No advisers match your current filters or search."
                />
              </div>
            )}

            {displayedAdvisers.map((a) => (
              <AdviserCard key={a.id} adviser={a} />
            ))}
          </div>

          {/* [SECTION] Advisers Table (Desktop View) */}
          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {!loading && displayedAdvisers.length === 0 && (
              <EmptyState
                title="No advisers found"
                subtitle="No advisers match your current filters or search."
              />
            )}

            {displayedAdvisers.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="table-header">Adviser</th>
                    <th className="table-header">ID</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Curriculum</th>
                    <th className="table-header">Assigned Section</th>
                    <th className="table-header">Sections</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedAdvisers.map((a) => (
                    <tr
                      key={a.id}
                      className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition cursor-pointer"
                      onClick={() => navigate(`/admin/advisers/view/${a.id}`)}
                    >
                      <td className="table-cell table-text">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xs border border-[var(--color-primary-200)] flex-shrink-0">
                            {a.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="table-text-link hover:underline">
                            {a.name}
                          </span>
                        </div>
                      </td>

                      <td className="table-cell table-text table-text-default font-mono text-xs">
                        #{a.adviserId}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {a.email}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {a.sections?.[0]?.curriculum ?? "—"}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {a.sections?.length
                          ? `Grade ${a.sections[0].gradeLevel} – ${a.sections[0].name}`
                          : "Unassigned"}
                      </td>

                      <td className="table-cell table-text table-text-default">
                        {a.sectionCount ?? a.sections?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AdminPageLayout>
    </>
  );
};

export default AdminAdvisers;