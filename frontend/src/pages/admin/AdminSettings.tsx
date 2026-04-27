/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import InputField from "../../components/toolbar/InputField";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// ? [INTERFACE] Settings form fields
interface SettingsForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  emailNotifications: boolean;
  darkMode: boolean;
}

const AdminSettings = () => {
  usePageTitle("Settings: Admin");

  // [STATES]
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SettingsForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: false,
    darkMode: false,
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
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // * [EFFECT] Reset loading state on mount
  useEffect(() => setLoading(false), []);

  // [HANDLE] Generic form field change
  const handleChange = (field: keyof SettingsForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // * [HANDLE] Save Password
  const handleSavePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = form;

    // ! [VALIDATION] All fields required
    if (!currentPassword || !newPassword || !confirmPassword) {
      openGeneralModal({
        title: "Incomplete Fields",
        message: "All password fields are required.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    // ! [VALIDATION] Passwords must match
    if (newPassword !== confirmPassword) {
      openGeneralModal({
        title: "Passwords Do Not Match",
        message: "New password and confirmation do not match.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/profile/change-password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json();

      // ! [ERROR] Handle backend status-code errors
      if (!res.ok) {
        let title = "Unable to Change Password";
        const message = data.message || "Failed to change password";
        if (res.status === 400) title = "Invalid Input";
        else if (res.status === 401) title = "Incorrect Password";
        else if (res.status === 404) title = "Admin Not Found";

        openGeneralModal({
          title,
          message,
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS] Password Updated
      openGeneralModal({
        title: "Password Updated",
        message: "Your password has been updated successfully.",
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });

      // [RESET] Clear password fields only
      setForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      // ! [ERROR] Network or server issue
      openGeneralModal({
        title: "Unable to Update Password",
        message: "We couldn't update the password at the moment. Please try again later.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    }
  };

  // * [HANDLE] Save Preferences
  const handleSavePreferences = async () => {
    const { emailNotifications, darkMode } = form;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailNotifications, darkMode }),
      });

      if (!res.ok) {
        // ! [ERROR] Preferences save failed
        openGeneralModal({
          title: "Unable to Save Preferences",
          message: "We couldn't save preferences at the moment. Please try again later.",
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS] Preferences Saved
      openGeneralModal({
        title: "Preferences Saved",
        message: "Your preferences have been updated successfully.",
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Network or server issue
      openGeneralModal({
        title: "Unable to Save Preferences",
        message: "We couldn't save preferences at the moment. Please try again later.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    }
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
          <span className="page-title">Settings</span>
        }
      >
        <div className="flex flex-col gap-4 max-w-lg">

          {/* [CARD] Security */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="text-[var(--color-text-700)]">Security</h3>

            {/* [FIELDS] Password inputs */}
            <div className="space-y-3">
              <InputField
                label="Current Password"
                type="password"
                value={form.currentPassword}
                onChange={(e) => handleChange("currentPassword", e.target.value)}
              />
              <InputField
                label="New Password"
                type="password"
                value={form.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
              />
              <InputField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
              />
            </div>

            {/* [BUTTON] Change Password */}
            <button
              onClick={handleSavePassword}
              className="w-full py-3 rounded-md cursor-pointer font-bold text-sm text-[var(--color-text-50)] bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Change Password
            </button>
          </div>

          {/* [CARD] Preferences */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="text-[var(--color-text-700)]">Preferences</h3>

            {/* [FIELDS] Toggle inputs */}
            <div className="space-y-3">
              <InputField
                label="Email Notifications"
                type="checkbox"
                value={form.emailNotifications}
                onChange={(e) => {
                  if (e.target instanceof HTMLInputElement) {
                    handleChange("emailNotifications", e.target.checked);
                  }
                }}
              />
              <InputField
                label="Dark Mode"
                type="checkbox"
                value={form.darkMode}
                onChange={(e) => {
                  if (e.target instanceof HTMLInputElement) {
                    handleChange("darkMode", e.target.checked);
                  }
                }}
              />
            </div>

            {/* [BUTTON] Save Preferences */}
            <button
              onClick={handleSavePreferences}
              className="w-full py-3 rounded-md cursor-pointer font-bold text-sm text-[var(--color-text-50)] bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50"
            >
              Save Preferences
            </button>
          </div>

        </div>
      </PageLayout>
    </>
  );
};

export default AdminSettings;