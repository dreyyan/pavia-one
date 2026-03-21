// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import DashboardSkeleton from "../../components/DashboardSkeleton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// ?[INTERFACES]
interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  isAdvisory: boolean;
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

// ?[FORM INTERFACE]
interface AdviserForm {
  name: string;
  email: string;
  sex?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactNumber?: string;
  role?: string;
}

const AdviserProfile = () => {
  const navigate = useNavigate();

  // [STATES]
  const [profile, setProfile] = useState<AdviserProfileData | null>(null);
  const [form, setForm] = useState<AdviserForm>({
    name: "",
    email: "",
    sex: "",
    dateOfBirth: "",
    nationality: "",
    contactNumber: "",
    role: "",
  });
  const [originalForm, setOriginalForm] = useState<AdviserForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "success" | "error" | "info" | "warning">("default");

  // [HANDLE] Form change
  const handleChange = (field: keyof AdviserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // [HANDLE] Toggle edit mode
  const toggleEdit = () => {
    if (isEditing && originalForm) setForm(originalForm);
    else if (!isEditing) setOriginalForm(form);
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Pagination
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage((p) => p - 1); };

  // [HANDLE] Save
  const handleSave = async () => {
    if (!form) return;

    // Validate required fields
    if (!form.name || !form.email) {
      setModalTitle("Validation Error");
      setModalMessage("Name and Email are required.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      const cleanMessage = data.message?.replace(/^\[ERROR\]\s*/, "");
      if (!data.success) {
        setModalTitle("Save Failed");
        setModalMessage(cleanMessage);
        setModalType("error");
        setShowModal(true);
        return;
      }

      setProfile((prev) => ({
        ...prev!,
        ...data.data,
      }));
      setModalTitle("Success");
      setModalMessage("Profile updated successfully!");
      setModalType("success");
      setShowModal(true);
      setIsEditing(false);
      setOriginalForm(form);

    } catch (err) {
      console.error(err);
      setModalTitle("Error");
      setModalMessage("Something went wrong while saving.");
      setModalType("error");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // *[EFFECT] Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        setProfile(data.data);
        setForm({
          name: data.data.name,
          email: data.data.email,
          sex: data.data.sex,
          dateOfBirth: data.data.dateOfBirth,
          nationality: data.data.nationality,
          contactNumber: data.data.contactNumber,
          role: data.data.role,
        });
        setOriginalForm({
          name: data.data.name,
          email: data.data.email,
          sex: data.data.sex,
          dateOfBirth: data.data.dateOfBirth,
          nationality: data.data.nationality,
          contactNumber: data.data.contactNumber,
          role: data.data.role,
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // [EFFECT] Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) navigate("/login/adviser");
  }, [isAuthenticated, navigate]);

  const SEX_OPTIONS = [
    { label: "M", value: "MALE" },
    { label: "F", value: "FEMALE" },
  ];

  if (loading || isAuthenticated === null) return <DashboardSkeleton />;

  return (
    <div className="py-6 px-4 flex flex-col items-center gap-y-4">
      {/* Modal */}
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

      {/* Profile Header */}
      <div className="flex items-center bg-[var(--color-primary-600)] border-2 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md w-full max-w-md">
        <div className="bg-[var(--color-bg-200)] w-24 h-24 rounded-full flex-shrink-0"></div>
        <div className="flex-1 flex flex-col">
          <p className="font-roboto font-medium text-sm text-[var(--color-text-50)] mb-1">
            Welcome, Ma'am/Sir
          </p>
          <p className="font-roboto font-extrabold text-xl mb-2 text-[var(--color-text-50)]">
            {profile?.name}
          </p>
          {profile?.advisorySection ? (
            <>
              <p className="font-roboto font-semibold text-sm text-[var(--color-text-100)]">
                Grade {profile.advisorySection.gradeLevel} — {profile.advisorySection.name}
              </p>
              <p className="font-roboto font-medium text-xs text-[var(--color-text-100)]">
                Class Adviser
              </p>
            </>
          ) : (
            <p className="text-[var(--color-red-600)] font-semibold text-sm">
              You are not assigned to any advisory section.
            </p>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="w-full max-w-md bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-3">
      {/* [SECTION] Pagination */}
      <div className="flex justify-between items-center space-x-4 my-3">
        {/* [BUTTON] Previous */}
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
            currentPage === 1
              ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
              : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
          }`}
        >
          &lt; Previous
        </button>

        {/* [UI] Page Number */}
        <span className="flex gap-x-1 text-sm text-[var(--color-text-900)] font-medium">
          Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
        </span>

        {/* [BUTTON] Next */}
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
            currentPage === totalPages
              ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
              : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
          }`}
        >
          Next &gt;
        </button>
      </div>

        {/* [BUTTON] Edit / Cancel */}
        <div className="flex justify-end gap-4">
          <button
            onClick={toggleEdit}
            disabled={currentPage === 2}
            className={`flex items-center gap-2 rounded-md text-sm px-4 py-2 transition font-roboto font-medium ${
              currentPage === 2
                ? "bg-[var(--color-bg-400)] cursor-not-allowed text-[var(--color-text-300)]"
                : "bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-[var(--color-text-50)]"
            }`}
          >
            {isEditing ? "Cancel" : "Edit"}

            {!isEditing && currentPage !== 2 && (
              <img
                src="/edit-icon.svg"
                className="size-4 object-contain"
                alt="edit icon"
              />
            )}
          </button>

          {/* [BUTTON] Save */}
          {isEditing && currentPage !== 2 && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-md text-sm px-4 py-2 bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] transition text-white font-roboto font-medium"
            >
              Save
            </button>
          )}
        </div>

        {/* Form Pages */}
        {currentPage === 1 && (
          <div className="space-y-3">
            <InputField label="Full Name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} disabled={!isEditing} />
            <InputField
              label="Sex"
              type="select"
              value={SEX_OPTIONS.find((s) => s.value === form.sex)?.label ?? ""}
              onChange={(e) => {
                const selectedLabel = e.target.value;
                const sexOption = SEX_OPTIONS.find((s) => s.label === selectedLabel);
                handleChange("sex", sexOption?.value ?? "");
              }}
              options={SEX_OPTIONS.map((s) => s.label)}
              placeholder="Select Sex"
              disabled={!isEditing}
            />
            <InputField label="Date of Birth" type="date" value={form.dateOfBirth ?? ""} onChange={(e) => handleChange("dateOfBirth", e.target.value)} disabled={!isEditing} />
            <InputField label="Nationality" value={form.nationality ?? ""} onChange={(e) => handleChange("nationality", e.target.value)} disabled={!isEditing} />
          </div>
        )}

        {currentPage === 2 && (
          <div className="space-y-3">
            <InputField
              label="Adviser ID"
              value={profile?.adviserId ?? ""}
              disabled={true}
              onChange={() => {}}
            />
            <InputField
              label="Advisory Grade"
              value={profile?.advisorySection?.gradeLevel?.toString() ?? ""}
              disabled={true}
              onChange={() => {}}
            />
            <InputField
              label="Section"
              value={profile?.advisorySection?.name ?? ""}
              disabled={true}
              onChange={() => {}}
            />
          </div>
        )}

        {currentPage === 3 && (
          <div className="space-y-3">
            <InputField label="Email Address" value={form.email} onChange={(e) => handleChange("email", e.target.value)} disabled={true} />
            <InputField label="Contact Number" value={form.contactNumber ?? ""} onChange={(e) => handleChange("contactNumber", e.target.value)} disabled={!isEditing} />
            <InputField label="Role" value={form.role ?? "Adviser"} onChange={(e) => handleChange("role", e.target.value)} disabled={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdviserProfile;