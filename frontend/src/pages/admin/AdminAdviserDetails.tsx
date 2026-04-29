/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import InputField from "../../components/toolbar/InputField";
import ProfileInfo from "../../components/info/ProfileInfo";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";
import AssignedSectionsCard from "../../components/cards/details/AssignedSectionsCard";
import DeleteButton from "../../components/buttons/DeleteButton";

// [IMPORT] Types
import { GeneralModalConfig, AdviserDetails } from "../../types";

// ? [TYPE] Active form page index
type FormPage = 0 | 1;

const PAGE_LABELS: [string, string] = ["Basic Information", "Contact & Details"];

const AdminAdviserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
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

  // * [HANDLE] Fetch Adviser by ID
  const fetchAdviser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch adviser");

      // [NORMALIZE] Split full name into first / middle / last
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

  // * [HANDLE] Delete Adviser
  const handleDelete = () => {
    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Adviser",
      message: "Are you sure you want to delete this adviser? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();

          if (!data.success) {
            // [HANDLE] Friendly backend error message
            const errorMessage =
              data?.error?.userFriendlyMessage ||
              data?.error?.message ||
              data.message ||
              "Failed to delete adviser";
            openGeneralModal({
              title: "Unable to Delete Adviser",
              message: errorMessage,
              type: "error",
              confirmText: "Close",
              isCancelable: false,
              onConfirm: () => closeGeneralModal(),
            });
            return;
          }

          // * [SUCCESS] Adviser Deleted
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
        } catch (err: any) {
          // ! [ERROR] Adviser deletion failed
          console.error("Delete error:", err);
          openGeneralModal({
            title: "Unable to Delete Adviser",
            message: err?.message || "We couldn't delete the adviser at the moment. Please try again later.",
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // [HANDLE] Edit toggle — discard changes on cancel
  const handleEditToggle = () => {
    if (isEditing) setFormData(adviser ?? {});
    setIsEditing(prev => !prev);
  };

  // * [HANDLE] Save Updated Adviser Details
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

      // [UPDATE] Merge saved changes into adviser state
      setAdviser({ ...adviser!, ...formData });
      setIsEditing(false);

      // * [SUCCESS] Adviser Updated
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
  const handleFieldChange =
    (field: keyof AdviserDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  // * [BREADCRUMBS] Admin Adviser Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Advisers", path: "/admin/advisers" },
    { label: adviser?.fullName ?? "Details", path: null, isName: true },
  ];

  // * [RENDER] Form fields per active page
  const renderFormPage = () => {
    if (!adviser) return null;

    // [PAGE 0] Basic Information
    if (activePage === 0) {
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
            options={["MALE", "FEMALE"]}
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

    // [PAGE 1] Contact & Details
    if (activePage === 1) {
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

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Adviser Details" />
        }
      >
        {adviser ? (
          <div className="space-y-4">

            {/* [COMPONENT] Profile Info */}
            <ProfileInfo lastName={adviser.lastName} firstName={adviser.firstName} />

            {/* [ACTIONS] Delete */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full xl:w-auto xl:ml-auto">
              <DeleteButton onClick={handleDelete} text="Delete Adviser" disabled={loading} />
            </div>

            {/* [CARD] Adviser Identity */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [UI] Page tabs */}
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

              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [HEADER] Section title + Edit / Save buttons */}
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

            {/* [COMPONENT] Assigned Sections */}
            <AssignedSectionsCard sections={adviser.sections} />

            {/* [META] Registration date */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Registered{" "}
              {new Date(adviser.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

          </div>
        ) : (
          // [EMPTY STATE] Adviser not found
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
      </PageLayout>
    </>
  );
};

export default AdminAdviserDetails;