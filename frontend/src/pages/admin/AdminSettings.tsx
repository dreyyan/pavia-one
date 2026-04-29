/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import InputField from "../../components/toolbar/InputField";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Types
import { GeneralModalConfig } from "../../types";
import PasswordRequirement from "../../components/authentication/PasswordRequirement";

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
  const navigate = useNavigate();

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
    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    // ! [VALIDATION] Weak password
    if (!isPasswordValid) {
      openGeneralModal({
        title: "Weak Password",
        message: "Please meet all password requirements.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

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

  // [DERIVED STATE] Real-time password validation checks
  const password = form.newPassword;

  const passwordChecks = {
    minLength:  password.length >= 8,
    hasUpper:   /[A-Z]/.test(password),
    hasLower:   /[a-z]/.test(password),
    hasNumber:  /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

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
        <div className="space-y-4">

          {/* [SECTION] System Configuration — navigation tiles */}
          <div className="bg-[var(--color-bg-100)] rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="text-[var(--color-text-700)]">System Configuration</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* [TILE] School Year Configuration */}
              <button
                onClick={() => navigate("/admin/school-years")}
                className="group flex items-start gap-4 bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] hover:border-[var(--color-primary-400)] hover:bg-[var(--color-bg-200)] rounded-md px-4 py-4 transition-all text-left cursor-pointer"
              >
                {/* [ICON] Calendar badge */}
                <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary-200)] transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 text-[var(--color-primary-700)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8"  y1="2" x2="8"  y2="6" />
                    <line x1="3"  y1="10" x2="21" y2="10" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <p className="font-roboto font-semibold text-sm text-[var(--color-text-900)] group-hover:text-[var(--color-primary-700)] transition">
                    School Year Configuration
                  </p>
                  <p className="text-xs font-roboto text-[var(--color-text-500)] mt-0.5 leading-relaxed">
                    Manage academic years, set the active year, configure Q1–Q4 date ranges, and lock completed years.
                  </p>
                </div>
              </button>

              {/* [PLACEHOLDER] Room for future config tiles */}
            </div>
          </div>

          {/* [GRID] Security + Preferences side by side on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* [CARD] Security */}
            <div className="bg-[var(--color-bg-100)] rounded-lg shadow-sm p-5 space-y-4">
              <h3 className="text-[var(--color-text-700)]">Security</h3>

              {/* [FIELDS] Password inputs */}
              <div className="space-y-3">
                <InputField
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                  value={form.currentPassword}
                  onChange={(e) => handleChange("currentPassword", e.target.value)}
                />
                <InputField
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={form.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                />
                <InputField
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                />

                {/* [SECTION] Password Requirements */}
                <div className="space-y-1 mt-2">
                  <PasswordRequirement
                    requirement="At least 8 characters"
                    isMet={passwordChecks.minLength}
                  />
                  <PasswordRequirement
                    requirement="Contains uppercase letter"
                    isMet={passwordChecks.hasUpper}
                  />
                  <PasswordRequirement
                    requirement="Contains lowercase letter"
                    isMet={passwordChecks.hasLower}
                  />
                  <PasswordRequirement
                    requirement="Contains a number"
                    isMet={passwordChecks.hasNumber}
                  />
                  <PasswordRequirement
                    requirement="Contains a special character"
                    isMet={passwordChecks.hasSpecial}
                  />
                </div>
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
            <div className="bg-[var(--color-bg-100)] rounded-lg shadow-sm p-5 space-y-4">
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
        </div>
      </PageLayout>
    </>
  );
};

export default AdminSettings;