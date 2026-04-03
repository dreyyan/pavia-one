/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
// [IMPORT] Hooks
import React from "react";
import { useState, useEffect } from "react";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import InputField from "../../components/InputField";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";

// ? [INTERFACES]
interface SettingsForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  emailNotifications: boolean;
  darkMode: boolean;
}

const AdviserSettings = () => {
  // [STATES]
  const [loading, setLoading] = useState(true);

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

  const [form, setForm] = useState<SettingsForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    darkMode: false,
  });

  const [originalForm, setOriginalForm] = useState<SettingsForm | null>(null);

  // *[EFFECT] Fetch adviser settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json" 
          },
        });

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

        const data = await res.json();
        const cleanMessage = data.message?.replace(/^\[ERROR\]\s*/, "");

        if (!data.success) {
          throw new Error(cleanMessage || "Failed to fetch settings");
        }

        const settingsForm: SettingsForm = {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          emailNotifications: data.data.emailNotifications ?? true,
          darkMode: data.data.darkMode ?? false,
        };

        setForm(settingsForm);
        setOriginalForm(settingsForm);
      } catch (err) {
        console.error(err);
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

  // [HANDLE] Form change
  const handleChange = (field: keyof SettingsForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // [HANDLE] Save settings (Password + Preferences)
  const handleSave = async () => {
    if (!originalForm) return;

    const { currentPassword, newPassword, confirmPassword, emailNotifications, darkMode } = form;

    // Password validation
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        openGeneralModal({
          title: "Incomplete Fields",
          message: "Current password is required to change password.",
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
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // [SECTION] Update Password (only if new password is provided)
      if (newPassword) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/change-password`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
          let title = "Unable to Change Password";
          const message = data.message || "Failed to change password";

          if (res.status === 400) title = "Invalid Input";
          else if (res.status === 401) title = "Incorrect Password";
          else if (res.status === 404) title = "Adviser Not Found";

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
      }

      // [SECTION] Update Preferences (only if changed)
      const preferencesChanged =
        emailNotifications !== originalForm.emailNotifications ||
        darkMode !== originalForm.darkMode;

      if (preferencesChanged) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emailNotifications, darkMode }),
        });

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
      }

      // Success
      openGeneralModal({
        title: "Settings Updated",
        message: "Your settings have been updated successfully.",
        type: "success",
        confirmText: "Got it",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });

      // Reset password fields
      setForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Update originalForm for next comparison
      setOriginalForm({
        ...form,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (err) {
      openGeneralModal({
        title: "Unable to Save Settings",
        message: "We couldn't save your settings at the moment. Please try again later.",
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
    <div className="py-6 px-4 flex flex-col gap-y-4">
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

      {/* [UI] Page Title */}
      <h1 className="text-[var(--color-text-800)]">Settings</h1>

      {/* [SECTION] Security */}
      <div className="w-full max-w-md bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-4">
        <div className="space-y-3">
          <h3 className="text-[var(--color-text-700)]">Security</h3>

          {/* [SECTION] Input Fields */}
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

          {/* [PRIMARY BUTTON] Update Password / Save Settings */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              className="flex justify-center items-center gap-x-2 w-full py-3 rounded-md cursor-pointer text-button font-bold text-[var(--color-text-50)] bg-green-600 transition-all duration-200 hover:bg-green-700 disabled:opacity-50"
            >
              <p className="button text-text-on-primary">Change Password</p>
            </button>
          </div>
        </div>
      </div>

      {/* [SECTION] Preferences */}
      <div className="w-full max-w-md bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-4">
        <div className="space-y-3">
          <h3 className="text-[var(--color-text-700)]">Preferences</h3>

          {/* [SECTION] Input Fields */}
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

          {/* [PRIMARY BUTTON] Save Preferences - Kept for consistency with Admin */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              className="flex justify-center items-center gap-x-2 w-full py-3 rounded-md cursor-pointer text-button font-bold text-[var(--color-text-50)] bg-[var(--color-primary-600)] transition-all duration-200 hover:bg-[var(--color-primary-700)] disabled:opacity-50"
            >
              <p className="button text-text-on-primary">Save Preferences</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdviserSettings;