/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */

// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/Skeleton";
import InputField from "../../components/InputField";
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

const AdviserSettings = () => {
  usePageTitle("Settings: Adviser");

  // [STATES]
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<SettingsForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
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

  const openGeneralModal = (
    config: Partial<Omit<GeneralModalConfig, "isOpen">>
  ) => {
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));
  };

  // * [EFFECT] Fetch adviser settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
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

        // ! [ERROR] Unauthorized session
        if (res.status === 401) {
          openGeneralModal({
            title: "Session Expired",
            message: "Please log in again.",
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
          return;
        }

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch settings");
        }

        // * [SUCCESS] Load settings
        setForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          emailNotifications: data.data.emailNotifications ?? true,
          darkMode: data.data.darkMode ?? false,
        });
      } catch (err) {
        openGeneralModal({
          title: "Error",
          message: "Failed to load settings.",
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // [HANDLE] Generic form change
  const handleChange = (
    field: keyof SettingsForm,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // * [HANDLE] Save Password
  const handleSavePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = form;

    // ! [VALIDATION]
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

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/change-password`,
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

      if (!res.ok) {
        let title = "Unable to Change Password";

        if (res.status === 400) title = "Invalid Input";
        else if (res.status === 401) title = "Incorrect Password";
        else if (res.status === 404) title = "Adviser Not Found";

        openGeneralModal({
          title,
          message: data.message || "Failed to change password",
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS]
      openGeneralModal({
        title: "Password Updated",
        message: "Your password has been updated successfully.",
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });

      // [RESET] password fields
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      openGeneralModal({
        title: "Unable to Update Password",
        message:
          "We couldn't update the password at the moment. Please try again later.",
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

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emailNotifications, darkMode }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        openGeneralModal({
          title: "Unable to Save Preferences",
          message: data.message || "Failed to update preferences.",
          type: "error",
          confirmText: "Close",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }

      // * [SUCCESS]
      openGeneralModal({
        title: "Preferences Saved",
        message: "Your preferences have been updated successfully.",
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      openGeneralModal({
        title: "Unable to Save Preferences",
        message:
          "We couldn't save preferences at the moment. Please try again later.",
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

      {/* [LAYOUT] Adviser Page */}
      <PageLayout
        header={<span className="page-title">Settings</span>}
      >
        <div className="flex flex-col gap-4 max-w-lg">

          {/* [CARD] Security */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="text-[var(--color-text-700)]">Security</h3>

            <div className="space-y-3">
              <InputField
                label="Current Password"
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  handleChange("currentPassword", e.target.value)
                }
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
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
              />
            </div>

            <button
              onClick={handleSavePassword}
              className="w-full py-3 rounded-md cursor-pointer font-bold text-sm text-[var(--color-text-50)] bg-green-600 hover:bg-green-700 transition-colors"
            >
              Change Password
            </button>
          </div>

          {/* [CARD] Preferences */}
          <div className="bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="text-[var(--color-text-700)]">Preferences</h3>

            <div className="space-y-3">
              <InputField
                label="Email Notifications"
                type="checkbox"
                value={form.emailNotifications}
                onChange={(e) => {
                  if (e.target instanceof HTMLInputElement) {
                    handleChange(
                      "emailNotifications",
                      e.target.checked
                    );
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

            <button
              onClick={handleSavePreferences}
              className="w-full py-3 rounded-md cursor-pointer font-bold text-sm text-[var(--color-text-50)] bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors"
            >
              Save Preferences
            </button>
          </div>

        </div>
      </PageLayout>
    </>
  );
};

export default AdviserSettings;