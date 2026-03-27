// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import DashboardSkeleton from "../../components/DashboardSkeleton";
import PageTitle from "../../components/PageTitle";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";

// ?[INTERFACES]
interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
  createdAt: string;
  sections: {
    id: number;
    name: string;
    gradeLevel: number;
    schoolYear: string;
    curriculum: string;
    classSize: number;
  }[];
}

const AdminAdvisers = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "id-asc" | "id-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  type FormData = {
    id?: number;
    adviserId: string;
    name: string;
    email: string;
    password: string;
  };

  const [formData, setFormData] = useState<FormData>({
    adviserId: "",
    name: "",
    email: "",
    password: "",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [STATE] Selected advisers for bulk operations
  const [selectedAdvisers, setSelectedAdvisers] = useState<number[]>([]);

  // [HANDLE] Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedAdvisers.length === 0) return;

    setModalTitle(`Delete ${selectedAdvisers.length} Selected Advisers`);
    setIsCancelable(true);
    setShowModal(true);

    const onBulkDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: selectedAdvisers }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Bulk delete failed");

        setAdvisers(prev => prev.filter(a => !selectedAdvisers.includes(a.id)));
        setSelectedAdvisers([]);
      } catch (err) {
        console.error("Bulk delete error:", err);
        setModalTitle("Bulk Delete Failed");
        setIsCancelable(true);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onBulkDeleteConfirm);
  };

  // *[HANDLE] Fetch Advisers
  const fetchAdvisers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch advisers");

      // ensure advisers is always an array (response is data.data.data due to pagination wrapper)
      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching advisers");
      setIsCancelable(true);
      setShowModal(true);
      setAdvisers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisers();
  }, []);

  // [HANDLE] Add adviser
  const handleAddAdviser = () => {
    setFormData({ adviserId: "", name: "", email: "", password: "" });
    setIsEditMode(false);
    setModalTitle("Create Adviser");
    setIsCancelable(true);
    setFormError("");
    setShowModal(true);
  };

  // [HANDLE] Open edit
  // Note: adviser PUT endpoint not available; editing opens modal pre-filled for reference
  const handleOpenEdit = (adviser: Adviser) => {
    setFormData({
      id: adviser.id,
      adviserId: adviser.adviserId,
      name: adviser.name,
      email: adviser.email,
      password: "",
    });
    setIsEditMode(true);
    setModalTitle("Edit Adviser");
    setIsCancelable(true);
    setFormError("");
    setShowModal(true);
  };

  // [HANDLE] Submit form
  const handleSubmit = async () => {
    const adviserId = (formData.adviserId || "").trim();
    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim();
    const password = (formData.password || "").trim();

    if (!adviserId) { setFormError("Adviser ID is required"); return; }
    if (!name) { setFormError("Name is required"); return; }
    if (!email) { setFormError("Email is required"); return; }
    if (!isEditMode && !password) { setFormError("Password is required"); return; }

    const dataToSubmit = isEditMode
      ? { adviserId, name, email, ...(password && { password }) }
      : { adviserId, name, email, password };

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        // [REFETCH] Re-fetch list after edit since PUT response shape may vary
        await fetchAdvisers();
      } else {
        const created = data.data?.created;
        if (created && created.length > 0) {
          setAdvisers(prev => [...prev, { ...created[0], sections: [] }]);
        } else {
          const failMsg = data.data?.failed?.[0]?.message;
          setFormError(failMsg || "Adviser creation failed");
          return;
        }
      }

      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete adviser
  const handleDelete = (id: number) => {
    setModalTitle("Delete Adviser");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete adviser");
        setAdvisers(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error("Delete error:", err);
        setModalTitle("Delete Failed");
        setIsCancelable(true);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onDeleteConfirm);
  };

  // [LOADING STATE]
  if (loading) return <DashboardSkeleton />;

  // [HANDLE] Sorting and Searching
  const filteredAdvisers = advisers
    .filter(a =>
      (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.adviserId && a.adviserId.includes(search)) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "id-asc": return a.adviserId.localeCompare(b.adviserId);
        case "id-desc": return b.adviserId.localeCompare(a.adviserId);
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

  return (
    <div className="py-10 px-4 space-y-4 relative">
      {/* [COMPONENT] CRUD Modal */}
      <CrudModal<FormData>
        isOpen={showModal}
        title={modalTitle}
        isCancelable={isCancelable}
        onClose={() => setShowModal(false)}
        onConfirm={isEditMode || modalTitle.includes("Create") ? handleSubmit : onConfirmAction}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        showForm={modalTitle === "Create Adviser" || modalTitle === "Edit Adviser"}
        formError={formError}
        formFields={[
          { key: "adviserId", label: "Adviser ID", type: "text" },
          { key: "name", label: "Full Name", type: "text" },
          { key: "email", label: "Email", type: "text" },
          { key: "password", label: isEditMode ? "Password (leave blank to keep)" : "Password", type: "text" },
        ]}
      />

      {/* [BREADCRUMBS] */}
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
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

      {/* [UI] Page Title */}
      <PageTitle title="Advisers" />

      {/* [SECTION] Search & Filters */}
      <div className="flex md:flex-row gap-2 md:gap-4 items-start md:items-center w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[var(--color-bg-50)] font-roboto rounded-sm py-2 pl-4 pr-3 outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
          />
        </div>

        {/* Sort Dropdown */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm p-2 transition cursor-pointer ${
              showSortFilters ? "bg-[var(--color-primary-600)]" : "bg-[var(--color-primary-700)] hover:opacity-80"
            }`}
          >
            <img src="/filter-icon.svg" alt="Sort" className="w-5 h-5" />
          </button>
          {showSortFilters && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}>Name ↑</button>
              <button onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}>Name ↓</button>
              <button onClick={() => { setSortOption("id-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "id-asc" ? "bg-blue-100" : ""}`}>Adviser ID ↑</button>
              <button onClick={() => { setSortOption("id-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "id-desc" ? "bg-blue-100" : ""}`}>Adviser ID ↓</button>
            </div>
          )}
        </div>
      </div>

      {/* [SECTION] Bulk Actions — shown only when rows are selected */}
      {selectedAdvisers.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[var(--color-bg-50)] rounded-md border border-[var(--color-bg-200)]">
          <span className="text-sm font-roboto text-[var(--color-text-700)]">
            {selectedAdvisers.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="text-sm font-medium font-roboto text-[var(--color-red-500)] hover:underline cursor-pointer"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedAdvisers([])}
            className="text-sm font-medium font-roboto text-[var(--color-text-600)] hover:underline cursor-pointer ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* [SECTION] Add Adviser */}
      <div className="mt-2 space-y-2">
        <PrimaryButton text="Add Adviser" iconSrc="/add-icon.svg" onClick={handleAddAdviser} />
      </div>

      {/* [SECTION] Advisers Table */}
      <div className="overflow-x-auto mt-4 rounded-lg">
        {displayedAdvisers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-center text-[var(--color-text-800)]">
            <img src="/no-data-icon.svg" alt="No advisers" className="size-16" />
            <p className="font-roboto font-semibold text-lg">No advisers found</p>
            <p className="font-roboto text-sm text-[var(--color-text-700)]">Try searching for a different name, ID, or email.</p>
          </div>
        ) : (
          <table className="overflow-hidden rounded-lg min-w-full bg-white shadow-md table-auto border-collapse">
            <thead className="bg-[var(--color-primary-600)] text-white font-figtree">
              <tr>
                <th className="py-2 px-4 pr-2 text-center">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAdvisers(filteredAdvisers.map(a => a.id));
                      else setSelectedAdvisers([]);
                    }}
                    checked={selectedAdvisers.length === filteredAdvisers.length && filteredAdvisers.length > 0}
                  />
                </th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] w-28">Adviser ID</th>
                <th className="py-2 px-4 text-left font-bold border-r border-[var(--color-primary-600)] truncate max-w-[180px]">Name</th>
                <th className="py-2 px-4 text-left hidden md:table-cell font-bold border-r border-[var(--color-primary-600)]">Email</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--color-primary-600)] w-20">Sections</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="font-roboto">
              {displayedAdvisers.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-bg-100)] transition-colors">
                  <td className="text-center py-2 px-4 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedAdvisers.includes(a.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAdvisers(prev => [...prev, a.id]);
                        else setSelectedAdvisers(prev => prev.filter(id => id !== a.id));
                      }}
                    />
                  </td>
                  <td className="text-sm font-mono py-2 px-4 text-[var(--color-text-700)] border-r border-[var(--color-bg-300)] w-28">{a.adviserId}</td>
                  <td className="text-md font-bold py-2 px-4 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] truncate whitespace-nowrap max-w-[160px]">{a.name}</td>
                  <td className="text-sm py-2 px-4 text-[var(--color-text-700)] hidden md:table-cell border-r border-[var(--color-bg-300)] truncate max-w-[200px]">{a.email}</td>
                  <td className="text-sm text-center py-2 px-2 text-[var(--color-text-900)] border-r border-[var(--color-bg-300)] w-20">
                    {a.sections?.length ?? 0}
                  </td>
                  <td className="py-2 px-4 flex gap-4">
                    <button className="text-[var(--color-primary-500)] text-sm font-medium cursor-pointer hover:underline" onClick={() => handleOpenEdit(a)}>Edit</button>
                    <button className="text-[var(--color-red-500)] text-sm font-medium cursor-pointer hover:underline" onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* [SECTION] Pagination */}
      {displayedAdvisers.length !== 0 && (
        <div className="flex justify-between items-center space-x-4 mt-4">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            &lt; Previous
          </button>
          <span className="flex gap-x-1 text-sm text-[var(--color-text-900)] font-medium">
            Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
          </span>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === totalPages ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAdvisers;