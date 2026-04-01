/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import ProfileInfo from "../../components/ProfileInfo";
import DeleteButton from "../../components/DeleteButton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// [IMPORT] Types
import { GeneralModalConfig, AdviserDetails } from "../../types";

// *[COMPONENT] Status Badge
const AdvisoryBadge = ({ isAdvisory }: { isAdvisory?: boolean }) => (
  isAdvisory ? (
    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
      Advisory
    </span>
  ) : null
);

// ?[TYPE] Form pages
type FormPage = 0 | 1;

const PAGE_LABELS: [string, string] = [
  "Basic Information",
  "Contact & Details",
];

// *[PAGE] Admin Adviser Details
const AdminAdviserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [adviser, setAdviser] = useState<AdviserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Identity Card
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AdviserDetails>>({});

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

  // * [HANDLE] Fetch adviser by id
  const fetchAdviser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch adviser");

      // Split full name into first, middle, last
      const fullName = data.data.name || "";
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts.shift() || "";
      const lastName = nameParts.pop() || "";
      const middleName = nameParts.join(" ") || "";

      const adviserWithSplitName: AdviserDetails = {
        ...data.data,
        firstName,
        middleName,
        lastName,
        fullName,
      };

      setAdviser(adviserWithSplitName);
      setFormData(adviserWithSplitName);
    } catch (err) {
      // ! [ERROR] Fetching adviser failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Adviser",
        message: "We couldn't load the adviser details at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdviser();
  }, [id]);

  // [HANDLE] Delete adviser
  const handleDelete = () => {
    const onDeleteConfirm = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete adviser");

        // * [SUCCESS] Adviser deleted
        openGeneralModal({
          title: "Adviser Deleted",
          message: "The adviser has been deleted successfully.",
          type: "success",
          isCancelable: false,
          onConfirm: () => {
            closeGeneralModal();
            navigate("/admin/advisers");
          },
        });
        
      } catch (err) {
        // ! [ERROR] Deleting adviser failed
        console.error("Delete error:", err);
        openGeneralModal({
          title: "Unable to Delete Adviser",
          message: "We couldn't delete the adviser at the moment. Please try again later.",
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      } finally {
        setLoading(false);
      }
    };

    // ? [CONFIRM] Show confirmation modal before deleting
    openGeneralModal({
      title: "Delete Adviser",
      message: "Are you sure you want to delete this adviser? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: onDeleteConfirm,
    });
  };

  // [HANDLE] Edit toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes
      setFormData(adviser ?? {});
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Save edits
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update adviser");
      setAdviser({ ...adviser!, ...formData });
      setIsEditing(false);

      // * [SUCCESS] Show success modal
      openGeneralModal({
        title: "Adviser Updated",
        message: `"${formData.firstName} ${formData.lastName}" has been updated successfully.`,
        type: "success",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Updating adviser failed
      console.error("Update error:", err);
      openGeneralModal({
        title: "Unable to Update Adviser",
        message: "We couldn't save your changes. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Generic form field change
  const handleFieldChange = (field: keyof AdviserDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // *[BREADCRUMBS] Admin Adviser Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Advisers", path: "/admin/advisers" },
    { label: adviser?.fullName ?? "Details", path: null },
  ];

  // *[RENDER] Form fields per page
  const renderFormPage = () => {
    if (!adviser) return null;

    if (activePage === 0) {
      // Basic Information
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="Adviser ID"
              value={formData.adviserId ?? ""}
              onChange={handleFieldChange("adviserId")}
              placeholder="e.g. ADV-0001"
              disabled
            />
          </div>
          <InputField
            label="Last Name"
            value={formData.lastName ?? ""}
            onChange={handleFieldChange("lastName")}
            placeholder="Last Name"
            disabled={!isEditing}
            required
          />
          <InputField
            label="First Name"
            value={formData.firstName ?? ""}
            onChange={handleFieldChange("firstName")}
            placeholder="First Name"
            disabled={!isEditing}
            required
          />
          <InputField
            label="Middle Name"
            value={formData.middleName ?? ""}
            onChange={handleFieldChange("middleName")}
            placeholder="Middle Name"
            disabled={!isEditing}
          />
          <InputField
            label="Name Extension"
            type="select"
            value={formData.nameExtension ?? ""}
            onChange={handleFieldChange("nameExtension")}
            placeholder="e.g. Jr., Sr."
            options={["Jr.", "Sr.", "II", "III", "IV"]}
            disabled={!isEditing}
          />
          <InputField
            label="Sex"
            type="select"
            value={formData.sex ?? ""}
            onChange={handleFieldChange("sex")}
            placeholder="Select sex"
            options={["Male", "Female"]}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Birth Date"
            type="date"
            value={formData.birthDate ? formData.birthDate.slice(0, 10) : ""}
            onChange={handleFieldChange("birthDate")}
            disabled={!isEditing}
          />
        </div>
      );
    }

    if (activePage === 1) {
      // Contact & Details
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <InputField
              label="Email"
              value={formData.email ?? ""}
              onChange={handleFieldChange("email")}
              placeholder="Email address"
              disabled={!isEditing}
            />
          </div>
          <InputField
            label="Contact Number"
            type="number"
            value={formData.contactNumber ?? ""}
            onChange={handleFieldChange("contactNumber")}
            placeholder="e.g. 09XXXXXXXXX"
            maxLength={11}
            disabled={!isEditing}
          />
        </div>
      );
    }

    return null;
  };

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

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">Adviser Details</h2>
          <nav className="font-roboto text-sm text-[var(--color-text-700)]">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx}>
                {crumb.path ? (
                  <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>
                    {crumb.label}
                  </span>
                ) : (
                  <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && " / "}
              </span>
            ))}
          </nav>
        </div>

        {adviser ? (
          <>
            {/* [COMPONENT] Profile Info */}
            <ProfileInfo lastName={adviser.lastName} firstName={adviser.firstName} />

            <div className="space-y-2">
              {/* [BUTTON] Delete */}
              <DeleteButton onClick={handleDelete} text="Delete Adviser" disabled={loading} />
            </div>

            {/* [CARD] Adviser Identity */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [PAGINATION] Page tabs */}
              <div className="flex gap-1 bg-[var(--color-bg-200)] rounded-lg p-1">
                {PAGE_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePage(idx as FormPage)}
                    className={`flex-1 text-xs font-roboto font-medium py-1.5 px-2 rounded-md transition-all duration-150 cursor-pointer ${
                      activePage === idx
                        ? "bg-[var(--color-bg-50)] text-[var(--color-text-900)] shadow-sm"
                        : "text-[var(--color-text-600)] hover:text-[var(--color-text-800)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* [DIVIDER] */}
              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [HEADER] Section title + Edit button */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                  {PAGE_LABELS[activePage]}
                </p>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="text-xs font-roboto font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  )}
                  <button
                    onClick={handleEditToggle}
                    disabled={loading}
                    className={`text-xs font-roboto font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEditing
                        ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                        : "text-[var(--color-text-50)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)]"
                    }`}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>

              {/* [FORM] Dynamic fields based on active page */}
              {renderFormPage()}

            </div>

            {/* [CARD] Sections */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Assigned Sections
              </p>

              {adviser.sections.length === 0 ? (
                <p className="text-sm font-roboto text-[var(--color-text-600)]">No sections assigned.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {adviser.sections.map((section) => (
                    <div
                      key={section.id}
                      className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-roboto font-semibold text-[var(--color-text-900)] truncate">
                          {section.name}
                        </p>
                        <p className="text-xs font-roboto text-[var(--color-text-600)]">
                          Grade {section.gradeLevel} · {section.curriculum} · {section.schoolYear}
                        </p>
                        <p className="text-xs font-roboto text-[var(--color-text-500)]">
                          {section.classSize} students
                        </p>
                      </div>
                      <AdvisoryBadge isAdvisory={section.isAdvisory} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* [META] Created At */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Registered{" "}
              {new Date(adviser.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </>
        ) : (
          // [EMPTY STATE]
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Adviser not found.</p>
            <button
              onClick={() => navigate("/admin/advisers")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Advisers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdviserDetails;