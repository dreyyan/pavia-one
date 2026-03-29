// [IMPORT] Hooks
import { useState, useEffect } from "react";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

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
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "success" | "error" | "info">("default");

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
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (res.status === 401) throw new Error("Session expired. Please log in again.");

        const data = await res.json();
        const cleanMessage = data.message?.replace(/^\[ERROR\]\s*/, "");

        if (!data.success) throw new Error(cleanMessage || "Failed to fetch settings");

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
        setModalTitle("Error");
        setModalMessage("Failed to load settings.");
        setModalType("error");
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // [HANDLE] Form change
  const handleChange = (field: keyof SettingsForm, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // [HANDLE] Save settings
  const handleSave = async () => {
    if (!originalForm) return;

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setModalTitle("Validation Error");
      setModalMessage("New password and confirmation do not match.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);

      // [SECTION] Update password
      if (form.newPassword) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/change-password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          }),
        });
        const data = await res.json();
        const cleanMessage = data.message?.replace(/^\[ERROR\]\s*/, "");
        if (!data.success) throw new Error(cleanMessage || "Failed to update password");
      }

      // [SECTION] Update preferences
      if (form.emailNotifications !== originalForm.emailNotifications || form.darkMode !== originalForm.darkMode) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            emailNotifications: form.emailNotifications,
            darkMode: form.darkMode,
          }),
        });
        const data = await res.json();
        const cleanMessage = data.message?.replace(/^\[ERROR\]\s*/, "");
        if (!data.success) throw new Error(cleanMessage || "Failed to update preferences");
      }

      setModalTitle("Success");
      setModalMessage("Settings updated successfully!");
      setModalType("success");
      setShowModal(true);

      // Clear passwords
      setForm({ ...form, currentPassword: "", newPassword: "", confirmPassword: "" });
      setOriginalForm(form);
    } catch (err) {
      console.error(err);
      setModalTitle("Error");
      setModalMessage("Failed to save settings.");
      setModalType("error");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="py-6 px-4 flex flex-col items-center gap-y-4">
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => setShowModal(false)}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
        />
      )}

      <div className="w-full max-w-md bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-5">
        <h2 className="font-roboto font-bold text-lg text-[var(--color-text-900)]">Settings</h2>

        {/* Security / Password */}
        <div className="space-y-3">
          <h3 className="font-medium text-[var(--color-text-700)]">Security</h3>
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

        {/* Preferences */}
        <div className="space-y-3">
          <h3 className="font-medium text-[var(--color-text-700)]">Preferences</h3>
          <div className="flex items-center justify-between">
            <label className="font-roboto text-sm">Email Notifications</label>
            <input
              type="checkbox"
              checked={form.emailNotifications}
              onChange={(e) => handleChange("emailNotifications", e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="font-roboto text-sm">Dark Mode</label>
            <input
              type="checkbox"
              checked={form.darkMode}
              onChange={(e) => handleChange("darkMode", e.target.checked)}
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-md bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-white font-roboto font-medium transition"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdviserSettings;