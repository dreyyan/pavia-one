/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import ProfileInfo from "../../components/ProfileInfo";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// [IMPORT] Types (if you have a shared types file, import from there)
import { GeneralModalConfig } from "../../types";

// ?[INTERFACES]
interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear?: string;
  curriculum?: string;
  classSize?: number;
}

interface AdviserProfileData {
  adviserId: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
  signatureUrl?: string;
  createdAt: string;
  updatedAt: string;
  sections?: Section[];
  advisorySection?: Section | null;

  sex?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactNumber?: string;
  role?: string;
}

interface AdviserProfileForm {
  name: string;
  email: string;
  sex?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactNumber?: string;
  role?: string;
}

const AdviserProfile = () => {
  usePageTitle("My Profile");

  // [STATES]
  const [profile, setProfile] = useState<AdviserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<AdviserProfileForm>({
    name: "",
    email: "",
    sex: "",
    dateOfBirth: "",
    nationality: "",
    contactNumber: "",
    role: "",
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

  // [SEX OPTIONS]
  const SEX_OPTIONS = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
  ];

  // *[EFFECT] Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        openGeneralModal({
          title: "Authentication Error",
          message: "You are not logged in. Please log in again.",
          type: "error",
          isCancelable: false,
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setProfile(data.data);

        setFormData({
          name: data.data.name,
          email: data.data.email,
          sex: data.data.sex || "",
          dateOfBirth: data.data.dateOfBirth || "",
          nationality: data.data.nationality || "",
          contactNumber: data.data.contactNumber || "",
          role: data.data.role || "Adviser",
        });
      } catch (err) {
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

    fetchProfile();
  }, []);

  // [HANDLE] Toggle Edit Mode
  const handleEditToggle = () => {
    if (isEditing && profile) {
      // Reset form to original values on cancel
      setFormData({
        name: profile.name,
        email: profile.email,
        sex: profile.sex || "",
        dateOfBirth: profile.dateOfBirth || "",
        nationality: profile.nationality || "",
        contactNumber: profile.contactNumber || "",
        role: profile.role || "Adviser",
      });
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Form Field Change
  const handleFieldChange =
    (field: keyof AdviserProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // [HANDLE] Save Profile
  const handleSave = async () => {
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

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

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
      console.error(err);
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
            {/* [COMPONENT] Profile Info Banner */}
            {profile && (() => {
              const [firstName, ...lastParts] = profile.name.split(" ");
              const lastName = lastParts.length > 0 ? lastParts.join(" ") : firstName;
              const displayFirstName = lastParts.length > 0 ? firstName : "";

              return (
                <ProfileInfo
                  lastName={lastName}
                  firstName={displayFirstName}
                  role="Class Adviser"
                />
              );
            })()}

            {/* [CARD] Personal Information */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-6 space-y-6">
              {/* Section Header + Buttons */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                  Personal Information
                </p>

                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="text-xs font-roboto font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  )}

                  <button
                    onClick={handleEditToggle}
                    disabled={loading}
                    className={`text-xs font-roboto font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEditing
                        ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                        : "text-[var(--color-text-50)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)]"
                    }`}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Full Name"
                  value={formData.name}
                  onChange={handleFieldChange("name")}
                  placeholder="e.g. Maria Santos"
                  disabled={!isEditing}
                  required
                />

                <InputField
                  label="Sex"
                  type="select"
                  value={SEX_OPTIONS.find((s) => s.value === formData.sex)?.label ?? ""}
                  onChange={(e) => {
                    const selected = SEX_OPTIONS.find((s) => s.label === e.target.value);
                    handleFieldChange("sex")({ target: { value: selected?.value || "" } } as any);
                  }}
                  options={SEX_OPTIONS.map((s) => s.label)}
                  placeholder="Select Sex"
                  disabled={!isEditing}
                />

                <InputField
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth ?? ""}
                  onChange={handleFieldChange("dateOfBirth")}
                  disabled={!isEditing}
                />

                <InputField
                  label="Nationality"
                  value={formData.nationality ?? ""}
                  onChange={handleFieldChange("nationality")}
                  placeholder="e.g. Filipino"
                  disabled={!isEditing}
                />

                <InputField
                  label="Contact Number"
                  value={formData.contactNumber ?? ""}
                  onChange={handleFieldChange("contactNumber")}
                  placeholder="e.g. 09123456789"
                  disabled={!isEditing}
                />

                <InputField
                  label="Email Address"
                  value={formData.email}
                  onChange={handleFieldChange("email")}
                  placeholder="your.email@example.com"
                  disabled={!isEditing}
                  required
                />

                <InputField
                  label="Adviser ID"
                  value={profile.adviserId}
                  disabled={true}
                  onChange={() => {}}
                  required
                />

                <InputField
                  label="Role"
                  value={formData.role || "Class Adviser"}
                  disabled={true}
                  onChange={() => {}}
                  required
                />

                {profile.advisorySection && (
                  <>
                    <InputField
                      label="Advisory Grade"
                      value={`Grade ${profile.advisorySection.gradeLevel}`}
                      onChange={() => {}}
                      disabled={true}
                    />
                    <InputField
                      label="Advisory Section"
                      value={profile.advisorySection.name}
                      onChange={() => {}}
                      disabled={true}
                    />
                  </>
                )}
              </div>
            </div>

            {/* [META] Account Created */}
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
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">
              Profile could not be loaded.
            </p>
            <button
              onClick={() => window.location.reload()}
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

export default AdviserProfile;