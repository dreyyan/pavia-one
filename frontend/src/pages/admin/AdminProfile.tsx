/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import ProfileInfo from "../../components/ProfileInfo";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// ?[INTERFACE] Admin profile shape
interface AdminProfileData {
  id: number;
  name: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// ?[INTERFACE] Editable form fields
interface AdminProfileForm {
  name: string;
  email: string;
}

// *[PAGE] Admin Profile
const AdminProfile = () => {
  usePageTitle("My Profile");

  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Identity Card
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AdminProfileForm>({
    name: "",
    email: "",
  });

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
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));
  };

  // *[HANDLE] Fetch own admin profile
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch profile");

      setProfile(data.data);
      setFormData({
        name: data.data.name,
        email: data.data.email,
      });
    } catch (err) {
      // ! [ERROR] Fetching profile failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Profile",
        message: "We couldn't load your profile at the moment. Please check your internet connection and try again.",
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
    fetchProfile();
  }, []);

  // [HANDLE] Edit toggle — discard changes on cancel
  const handleEditToggle = () => {
    if (isEditing && profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
      });
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Generic text field change
  const handleFieldChange =
    (field: keyof AdminProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // *[HANDLE] Save profile edits
  const handleSave = async () => {
    // ! [VALIDATION] Name and email are required
    if (!formData.name.trim() || !formData.email.trim()) {
      openGeneralModal({
        title: "Validation Error",
        message: "Name and Email are required fields.",
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    // ! [VALIDATION] Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      openGeneralModal({
        title: "Validation Error",
        message: "Please enter a valid email address.",
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update profile");

      // * [SUCCESS] Sync local state with saved data
      setProfile((prev) => ({ ...prev!, ...data.data }));
      setIsEditing(false);

      openGeneralModal({
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
        type: "success",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Saving profile failed
      console.error("Update error:", err);
      openGeneralModal({
        title: "Unable to Save Changes",
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

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // *[RENDER] Personal Information fields
  const renderFormPage = () => {
    if (!profile) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <InputField
            label="Display Name"
            value={formData.name}
            onChange={handleFieldChange("name")}
            placeholder="e.g. Juan Dela Cruz"
            disabled={!isEditing}
            required
          />
        </div>
        <InputField
          label="Username"
          value={profile.username}
          onChange={() => {}}
          disabled
        />
        <InputField
          label="Email"
          value={formData.email}
          onChange={handleFieldChange("email")}
          placeholder="Email address"
          disabled={!isEditing}
          required
        />
      </div>
    );
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

        {/* [SECTION] Header */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">My Profile</h2>
          <p className="font-roboto text-sm text-[var(--color-text-700)]">
            Manage your account details.
          </p>
        </div>

        {profile ? (
          <>
            {/* [COMPONENT] Profile Info banner */}
            {profile && (() => {
              const [firstName, ...lastParts] = profile.name.split(" ");
              const lastName = lastParts.length > 0 ? lastParts.join(" ") : firstName;
              const displayFirstName = lastParts.length > 0 ? firstName : "";

              // Pass role here
              return <ProfileInfo lastName={lastName} firstName={displayFirstName} role="Admin" />
            })()}

            {/* [CARD] Personal Information */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">

              {/* [DIVIDER] */}
              <div className="border-t border-[var(--color-bg-200)]" />

              {/* [HEADER] Section title + Edit / Save buttons */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                  Personal Information
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

              {/* [FORM] Personal Information fields */}
              {renderFormPage()}

            </div>

            {/* [META] Timestamps */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Account created{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </>
        ) : (
          // [EMPTY STATE]
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">
              Profile could not be loaded.
            </p>
            <button
              onClick={fetchProfile}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;