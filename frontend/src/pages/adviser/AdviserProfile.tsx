// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/Skeleton";
import InputField from "../../components/InputField";
import ProfileInfo from "../../components/ProfileInfo";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// ? [INTERFACES]
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

  sex?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactNumber?: string;
  role?: string;

  advisorySection?: Section | null;
}

interface AdviserProfileForm {
  name: string;
  email: string;
  sex: string;
  dateOfBirth: string;
  nationality: string;
  contactNumber: string;
  role: string;
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

  const openGeneralModal = (
    config: Partial<Omit<GeneralModalConfig, "isOpen">>
  ) => {
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));
  };

  // * [EFFECT] Fetch adviser profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        // * [SUCCESS] Set profile + form
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
          message:
            "We couldn't load your profile at the moment. Please try again later.",
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

  // [HANDLE] Toggle edit mode
  const handleEditToggle = () => {
    if (isEditing && profile) {
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

  // [HANDLE] Form change
  const handleFieldChange =
    (field: keyof AdviserProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  // * [HANDLE] Save profile
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      openGeneralModal({
        title: "Validation Error",
        message: "Name and Email are required.",
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      // * [SUCCESS] Sync state
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
        message:
          "We couldn't save your changes. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  // [COMPUTE] Name split for banner
  const [firstName, ...lastParts] = (profile?.name ?? "").split(" ");
  const lastName = lastParts.length ? lastParts.join(" ") : firstName;
  const displayFirstName = lastParts.length ? firstName : "";

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
      <PageLayout header={<span className="page-title">My Profile</span>}>
        <div className="flex flex-col gap-4 max-w-3xl">

          {/* [COMPONENT] Profile Banner */}
          {profile && (
            <ProfileInfo
              lastName={lastName}
              firstName={displayFirstName}
              role="Adviser"
            />
          )}

          {/* [CARD] Personal Information */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-5">

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

            {/* [FORM] Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <InputField
                label="Full Name"
                value={formData.name}
                onChange={handleFieldChange("name")}
                disabled={!isEditing}
              />

              <InputField
                label="Email"
                value={formData.email}
                onChange={handleFieldChange("email")}
                disabled={!isEditing}
              />

              <InputField
                label="Sex"
                value={formData.sex}
                onChange={handleFieldChange("sex")}
                disabled={!isEditing}
              />

              <InputField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleFieldChange("dateOfBirth")}
                disabled={!isEditing}
              />

              <InputField
                label="Nationality"
                value={formData.nationality}
                onChange={handleFieldChange("nationality")}
                disabled={!isEditing}
              />

              <InputField
                label="Contact Number"
                value={formData.contactNumber}
                onChange={handleFieldChange("contactNumber")}
                disabled={!isEditing}
              />

              <InputField
                label="Adviser ID"
                value={profile?.adviserId || ""}
                disabled
                onChange={() => {}}
              />

              <InputField
                label="Role"
                value={formData.role || "Adviser"}
                disabled
                onChange={() => {}}
              />

              {profile?.advisorySection && (
                <>
                  <InputField
                    label="Advisory Grade"
                    value={`Grade ${profile.advisorySection.gradeLevel}`}
                    disabled
                    onChange={() => {}}
                  />

                  <InputField
                    label="Advisory Section"
                    value={profile.advisorySection.name}
                    disabled
                    onChange={() => {}}
                  />
                </>
              )}
            </div>
          </div>

          {/* [META] */}
          {profile && (
            <p className="text-xs text-[var(--color-text-500)] text-right">
              Account created{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </PageLayout>
    </>
  );
};

export default AdviserProfile;