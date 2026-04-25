/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import InputField from "../../components/InputField";
import ProfileInfo from "../../components/ProfileInfo";
import Breadcrumbs from "../../components/Breadcrumbs";
import TabbedFormCard from "../../components/cards/TabbedFormCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Constants & Types
import { GeneralModalConfig } from "../../types";

// ? [TYPE] Active form page index
type FormPage = 0 | 1 | 2;

const PAGE_LABELS: [string, string, string] = ["Basic Information", "Address", "Parents & Guardian"];

// ? [INTERFACE] Student entity shape
interface Student {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  email?: string;
  sex?: string;
  birthDate?: string;
  sectionId?: number;
  sectionName?: string;
  gradeLevel?: number;
  motherTongue?: string;
  ip?: string;
  religion?: string;
  houseNo?: string;
  street?: string;
  sitio?: string;
  purok?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  learningModality?: string;
}

// ? [INTERFACE] Editable form fields
interface StudentForm {
  lastName: string;
  firstName: string;
  middleName?: string;
  sex?: string;
  birthDate?: string;
  motherTongue?: string;
  ip?: string;
  religion?: string;
  houseNo?: string;
  street?: string;
  sitio?: string;
  purok?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  learningModality?: string;
}

// [CONSTANT] Learning modality options
const LEARNING_MODALITIES = [
  { label: "Face to Face", value: "FACE_TO_FACE" },
  { label: "Distance Learning", value: "DISTANCE_LEARNING" },
  { label: "Blended", value: "BLENDED" },
  { label: "Online", value: "ONLINE" },
  { label: "Homeschool", value: "HOMESCHOOL" },
  { label: "Other", value: "OTHER" },
];

const AdviserClassStudentDetails = () => {
  const { sectionId, studentId } = useParams<{ sectionId: string; studentId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Identity Card
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StudentForm>({
    lastName: "",
    firstName: "",
    middleName: "",
    sex: "",
    birthDate: "",
    motherTongue: "",
    ip: "",
    religion: "",
    houseNo: "",
    street: "",
    sitio: "",
    purok: "",
    barangay: "",
    municipality: "",
    province: "",
    fatherName: "",
    motherName: "",
    guardianName: "",
    guardianRelationship: "",
    guardianContact: "",
    learningModality: "",
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

  // * [HANDLE] Fetch Student Details
  const fetchStudent = async () => {
    if (!sectionId || !studentId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();
      if (!data.success || !data.data) throw new Error(data.message || "Failed to fetch student data");

      const s = data.data;
      setStudent({
        ...s,
        sectionName: s.sectionName ?? "",
        gradeLevel: s.gradeLevel ?? undefined,
        sectionId: s.sectionId ?? undefined,
      });

      setFormData({
        lastName: s.lastName ?? "",
        firstName: s.firstName ?? "",
        middleName: s.middleName ?? "",
        sex: s.sex?.toUpperCase() === "MALE" ? "Male" : s.sex?.toUpperCase() === "FEMALE" ? "Female" : "",
        birthDate: s.birthDate ?? "",
        motherTongue: s.motherTongue ?? "",
        ip: s.ip ?? "",
        religion: s.religion ?? "",
        houseNo: s.houseNo ?? "",
        street: s.street ?? "",
        sitio: s.sitio ?? "",
        purok: s.purok ?? "",
        barangay: s.barangay ?? "",
        municipality: s.municipality ?? "",
        province: s.province ?? "",
        fatherName: s.fatherName ?? "",
        motherName: s.motherName ?? "",
        guardianName: s.guardianName ?? "",
        guardianRelationship: s.guardianRelationship ?? "",
        guardianContact: s.guardianContact ?? "",
        learningModality: s.learningModality ?? "",
      });
    } catch (err) {
      // ! [ERROR] Fetching student failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Student",
        message: "We couldn't load the student details at the moment. Please check your internet connection and try again.",
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
    fetchStudent();
  }, [sectionId, studentId]);

  // [HANDLE] Edit toggle — discard changes on cancel
  const handleEditToggle = () => {
    if (isEditing && student) {
      setFormData({
        lastName: student.lastName ?? "",
        firstName: student.firstName ?? "",
        middleName: student.middleName ?? "",
        sex: student.sex?.toUpperCase() === "MALE" ? "Male" : student.sex?.toUpperCase() === "FEMALE" ? "Female" : "",
        birthDate: student.birthDate ?? "",
        motherTongue: student.motherTongue ?? "",
        ip: student.ip ?? "",
        religion: student.religion ?? "",
        houseNo: student.houseNo ?? "",
        street: student.street ?? "",
        sitio: student.sitio ?? "",
        purok: student.purok ?? "",
        barangay: student.barangay ?? "",
        municipality: student.municipality ?? "",
        province: student.province ?? "",
        fatherName: student.fatherName ?? "",
        motherName: student.motherName ?? "",
        guardianName: student.guardianName ?? "",
        guardianRelationship: student.guardianRelationship ?? "",
        guardianContact: student.guardianContact ?? "",
        learningModality: student.learningModality ?? "",
      });
    }
    setIsEditing(prev => !prev);
  };

  // * [HANDLE] Save Updated Student Details
  const handleSave = async () => {
    if (!sectionId || !studentId) return;

    // ! [VALIDATION] Required fields
    if (!formData.lastName?.trim() || !formData.firstName?.trim()) {
      openGeneralModal({
        title: "Validation Error",
        message: "First name and last name are required.",
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    // ! [VALIDATION] Guardian contact digits only
    if (formData.guardianContact && !/^\d+$/.test(formData.guardianContact)) {
      openGeneralModal({
        title: "Validation Error",
        message: "Guardian contact number should contain only digits.",
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
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save student data");

      // [UPDATE] Sync local student state
      setStudent(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);

      // * [SUCCESS] Student Updated
      openGeneralModal({
        title: "Student Updated",
        message: "Student details have been saved successfully.",
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err) {
      // ! [ERROR] Student save failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Save Changes",
        message: "Something went wrong while saving. Please check your connection and try again.",
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
    (field: keyof StudentForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  // * [BREADCRUMBS] Adviser Class Student Details navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    {
      label: student ? `${student.gradeLevel ?? "?"} — ${student.sectionName ?? "Section"}` : "Section",
      path: student?.sectionId ? `/adviser/classes/${student.sectionId}` : "/adviser/classes",
    },
    { label: "Students", path: `/adviser/classes/${sectionId}/students` },
    { label: student?.fullName ?? "Details", path: null, isName: true },
  ];

  // * [RENDER] Form fields per active page
  const renderFormPage = () => {
    if (!student) return null;

    // [PAGE 0] Basic Information
    if (activePage === 0) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InputField
            label="Last Name"
            value={formData.lastName}
            onChange={handleFieldChange("lastName")}
            placeholder="Last Name"
            disabled={!isEditing}
            required
          />
          <InputField
            label="First Name"
            value={formData.firstName}
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
            label="Sex"
            type="select"
            value={formData.sex ?? ""}
            onChange={handleFieldChange("sex")}
            placeholder="Select sex"
            options={["Male", "Female"]}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Birth Date"
            type="date"
            value={formData.birthDate ? formData.birthDate.slice(0, 10) : ""}
            onChange={handleFieldChange("birthDate")}
            disabled={!isEditing}
            required
          />
          <InputField
            label="Mother Tongue"
            value={formData.motherTongue ?? ""}
            onChange={handleFieldChange("motherTongue")}
            placeholder="Mother Tongue"
            disabled={!isEditing}
          />
          <InputField
            label="IP (Ethnic Group)"
            value={formData.ip ?? ""}
            onChange={handleFieldChange("ip")}
            placeholder="Ethnic Group"
            disabled={!isEditing}
          />
          <InputField
            label="Religion"
            value={formData.religion ?? ""}
            onChange={handleFieldChange("religion")}
            placeholder="Religion"
            disabled={!isEditing}
          />
          <InputField
            label="Learning Modality"
            type="select"
            value={LEARNING_MODALITIES.find(m => m.value === formData.learningModality)?.label ?? ""}
            onChange={(e) => {
              const modality = LEARNING_MODALITIES.find(m => m.label === e.target.value);
              setFormData(prev => ({ ...prev, learningModality: modality?.value ?? "" }));
            }}
            options={LEARNING_MODALITIES.map(m => m.label)}
            placeholder="Select modality"
            disabled={!isEditing}
            required
          />
        </div>
      );
    }

    // [PAGE 1] Address
    if (activePage === 1) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InputField
            label="House #"
            value={formData.houseNo ?? ""}
            onChange={handleFieldChange("houseNo")}
            placeholder="House #"
            disabled={!isEditing}
          />
          <InputField
            label="Street"
            value={formData.street ?? ""}
            onChange={handleFieldChange("street")}
            placeholder="Street"
            disabled={!isEditing}
          />
          <InputField
            label="Sitio"
            value={formData.sitio ?? ""}
            onChange={handleFieldChange("sitio")}
            placeholder="Sitio"
            disabled={!isEditing}
          />
          <InputField
            label="Purok"
            value={formData.purok ?? ""}
            onChange={handleFieldChange("purok")}
            placeholder="Purok"
            disabled={!isEditing}
          />
          <InputField
            label="Barangay"
            value={formData.barangay ?? ""}
            onChange={handleFieldChange("barangay")}
            placeholder="Barangay"
            disabled={!isEditing}
            required
          />
          <InputField
            label="Municipality / City"
            value={formData.municipality ?? ""}
            onChange={handleFieldChange("municipality")}
            placeholder="Municipality or City"
            disabled={!isEditing}
            required
          />
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="Province"
              value={formData.province ?? ""}
              onChange={handleFieldChange("province")}
              placeholder="Province"
              disabled={!isEditing}
              required
            />
          </div>
        </div>
      );
    }

    // [PAGE 2] Parents & Guardian
    if (activePage === 2) {
      return (
        <div className="space-y-5">
          {/* [SECTION] Father */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Father's Name
            </p>
            <InputField
              label="Full Name"
              sublabel="(Last Name, First Name, Middle Name)"
              value={formData.fatherName ?? ""}
              onChange={handleFieldChange("fatherName")}
              placeholder="e.g. Dela Cruz, Juan, Santos"
              disabled={!isEditing}
            />
          </div>

          {/* [SECTION] Mother */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Mother's Maiden Name
            </p>
            <InputField
              label="Full Name"
              sublabel="(Last Name, First Name, Middle Name)"
              value={formData.motherName ?? ""}
              onChange={handleFieldChange("motherName")}
              placeholder="e.g. Santos, Maria, Cruz"
              disabled={!isEditing}
            />
          </div>

          {/* [SECTION] Guardian */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Guardian's Name{" "}
              <span className="normal-case font-normal text-[var(--color-text-400)]">(if not Parent)</span>
            </p>
            <div className="space-y-3">
              <InputField
                label="Full Name"
                sublabel="(Last Name, First Name, Middle Name)"
                value={formData.guardianName ?? ""}
                onChange={handleFieldChange("guardianName")}
                placeholder="e.g. Dela Cruz, Pedro, Reyes"
                disabled={!isEditing}
              />
              <InputField
                label="Relationship"
                value={formData.guardianRelationship ?? ""}
                onChange={handleFieldChange("guardianRelationship")}
                placeholder="e.g. Uncle, Grandparent"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* [FIELD] Contact Number */}
          <InputField
            label="Contact Number of Parent / Guardian"
            type="number"
            value={formData.guardianContact ?? ""}
            onChange={handleFieldChange("guardianContact")}
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

      {/* [LAYOUT] Adviser Page */}
      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="Student Details" />}
      >
        {student ? (
          <div className="space-y-4">

            {/* [COMPONENT] Profile Info */}
            <ProfileInfo lastName={student.lastName} firstName={student.firstName} />

            {/* [ACTIONS] Generate SF9 */}
            <PrimaryButton
              text="Generate SF9"
              iconSrc="/generate-file.svg"
              onClick={() => console.log("SF9 generation not implemented yet.")}
            />

            {/* [COMPONENT] Student Details */}
            <TabbedFormCard
              labels={PAGE_LABELS}
              activePage={activePage}
              setActivePage={(p) => setActivePage(p as FormPage)}
              isEditing={isEditing}
              loading={loading}
              onSave={handleSave}
              onToggleEdit={handleEditToggle}
            >
              {renderFormPage()}
            </TabbedFormCard>

            {/* [META] LRN + Registration hint */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-roboto text-[var(--color-text-500)]">
                LRN: <span className="font-mono font-semibold">{student.lrn}</span>
              </p>
              {student.birthDate && (
                <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
                  Born{" "}
                  {new Date(student.birthDate).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

          </div>
        ) : (
          // [EMPTY STATE] Student not found
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Student not found.</p>
            <button
              onClick={() => navigate(`/adviser/classes/${sectionId}/students`)}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Students
            </button>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default AdviserClassStudentDetails;