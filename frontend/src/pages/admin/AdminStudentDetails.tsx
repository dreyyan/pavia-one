/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import InputField from "../../components/InputField";
import ProfileInfo from "../../components/ProfileInfo";
import Breadcrumbs from "../../components/Breadcrumbs";
import TabbedFormCard from "../../components/cards/TabbedFormCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import DeleteButton from "../../components/buttons/DeleteButton";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Constants, Helpers & Types
import { STUDENT_DETAILS_PAGE_LABELS } from "../../constants";
import { normalizeSex } from "../../helpers";
import type { StudentDetails, GeneralModalConfig } from "../../types";
import PersonInfoCard from "../../components/cards/PersonInfoCard";
import EnrollmentHistoryCard from "../../components/cards/EnrollmentHistoryCard";

// ? [TYPE] Active form page index
type FormPage = 0 | 1 | 2;

const AdminStudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // [STATES] Entities
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Identity Card
  const [activePage, setActivePage] = useState<FormPage>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentDetails>>({});

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
    setGeneralModal({
      ...generalModal,
      isOpen: true,
      ...config,
    });
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // * [HANDLE] Fetch Student Details by ID
  const fetchStudent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch student");

      const normalizedStudent = {
        ...data.data,
        sex: normalizeSex(data.data.sex),
      };

      setStudent(normalizedStudent);
      setFormData(normalizedStudent);
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
  }, [id]);

  // * [HANDLE] Delete Student
  const handleDelete = () => {
    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Student",
      message: "Are you sure you want to delete this student? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          // ! [ERROR] Backend failure response
          if (!data.success) throw new Error(data.message || "Failed to delete student");

          // * [SUCCESS] Student Deleted — navigate back to list
          openGeneralModal({
            title: "Student Deleted",
            message: "Student deleted successfully.",
            type: "success",
            confirmText: "OK",
            isCancelable: false,
            onConfirm: () => {
              closeGeneralModal();
              navigate("/admin/students");
            },
          });
        } catch (err) {
          // ! [ERROR] Student deletion failed
          console.error("Delete error:", err);
          openGeneralModal({
            title: "Unable to Delete Student",
            message: "We couldn't delete the student at the moment. Please check your internet connection and try again.",
            type: "error",
            confirmText: "OK",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // [HANDLE] Edit Toggle (discard changes on cancel)
  const handleEditToggle = () => {
    if (isEditing) setFormData(student ?? {});
    setIsEditing(prev => !prev);
  };

  // * [HANDLE] Save Updated Student Details
  const handleSave = async () => {
    if (!id || !student) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // [PAYLOAD] Build clean payload matching backend expectations
      const payload = {
        id: Number(id),
        firstName: formData.firstName?.trim(),
        middleName: formData.middleName?.trim() || null,
        lastName: formData.lastName?.trim(),
        nameExtension: formData.nameExtension?.trim() || null,
        sex: formData.sex ? formData.sex.toUpperCase() : undefined,
        birthDate: formData.birthDate || null,
        email: formData.email?.trim() || null,
        motherTongue: formData.motherTongue?.trim() || null,
        ipEthnicGroup: formData.ipEthnicGroup?.trim() || null,
        religion: formData.religion?.trim() || null,

        // [ADDRESS] Fields
        houseStreet: formData.houseStreet?.trim() || null,
        barangay: formData.barangay?.trim() || null,
        municipality: formData.municipalityCity?.trim() || null,
        province: formData.province?.trim() || null,

        // [FAMILY] Guardian / Parent fields
        fatherFirstName: formData.fatherFirstName?.trim() || null,
        fatherLastName: formData.fatherLastName?.trim() || null,
        fatherMiddleName: formData.fatherMiddleName?.trim() || null,
        motherFirstName: formData.motherFirstName?.trim() || null,
        motherLastName: formData.motherLastName?.trim() || null,
        motherMiddleName: formData.motherMiddleName?.trim() || null,
        guardianFirstName: formData.guardianFirstName?.trim() || null,
        guardianLastName: formData.guardianLastName?.trim() || null,
        guardianMiddleName: formData.guardianMiddleName?.trim() || null,
        contactNumber: formData.contactNumber?.trim() || null,
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        const errorMsg =
          data.message ||
          data.data?.failed?.[0]?.message ||
          "Failed to update student";
        throw new Error(errorMsg);
      }

      // [UPDATE] Local state with saved values
      setStudent(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);

      // * [SUCCESS] Student Updated
      openGeneralModal({
        title: "Student Updated",
        message: "Student details have been successfully updated.",
        type: "success",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Student update failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Update Student",
        message: "We couldn't update the student at the moment. Please check your internet connection and try again.",
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Generic form field change
  const handleFieldChange =
    (field: keyof StudentDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  // * [BREADCRUMBS] Admin Student Details navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Students", path: "/admin/students" },
    { label: student?.fullName ?? "Details", path: null, isName: true },
  ];

  // * [RENDER] Form fields per active page
  const renderFormPage = () => {
    if (!student) return null;

    // [PAGE 0] Basic Information
    if (activePage === 0) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3">
            <InputField
              label="LRN"
              type="number"
              value={formData.lrn ?? ""}
              onChange={handleFieldChange("lrn")}
              placeholder="12-digit LRN"
              maxLength={12}
              disabled={!isEditing}
              readOnly={true}
            />
          </div>
          <InputField
            label="Last Name"
            value={formData.lastName ?? ""}
            onChange={handleFieldChange("lastName")}
            placeholder="e.g. Dela Cruz"
            disabled={!isEditing}
            required
          />
          <InputField
            label="First Name"
            value={formData.firstName ?? ""}
            onChange={handleFieldChange("firstName")}
            placeholder="e.g. Juan"
            disabled={!isEditing}
            required
          />
          <InputField
            label="Middle Name"
            value={formData.middleName ?? ""}
            onChange={handleFieldChange("middleName")}
            placeholder="e.g. Santos"
            disabled={!isEditing}
          />
          <InputField
            label="Name Extension"
            type="select"
            value={formData.nameExtension ?? ""}
            onChange={handleFieldChange("nameExtension")}
            placeholder="e.g. Jr., Sr."
            options={["Jr.", "Sr.", "II", "III", "IV"]}
            disabled={!isEditing}
          />
          <InputField
            label="Sex"
            type="select"
            value={formData.sex ?? ""}
            onChange={handleFieldChange("sex")}
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
            label="Mother Tongue (Grade 1–3)"
            value={formData.motherTongue ?? ""}
            onChange={handleFieldChange("motherTongue")}
            placeholder="e.g. Hiligaynon"
            disabled={!isEditing}
          />
          <InputField
            label="IP (Ethnic Group)"
            value={formData.ipEthnicGroup ?? ""}
            onChange={handleFieldChange("ipEthnicGroup")}
            placeholder="e.g. Aeta, Igorot, Mangyan, etc."
            disabled={!isEditing}
          />
          <InputField
            label="Religion"
            value={formData.religion ?? ""}
            onChange={handleFieldChange("religion")}
            placeholder="e.g. Roman Catholic, Christianity, etc."
            disabled={!isEditing}
          />
        </div>
      );
    }

    // [PAGE 1] Address
    if (activePage === 1) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <InputField
              label="House # / Street / Sitio / Purok"
              value={formData.houseStreet ?? ""}
              onChange={handleFieldChange("houseStreet")}
              placeholder="e.g. Purok 3, Brgy. San Jose"
              disabled={!isEditing}
            />
          </div>
          <InputField
            label="Barangay"
            value={formData.barangay ?? ""}
            onChange={handleFieldChange("barangay")}
            placeholder="e.g. Poblacion"
            disabled={!isEditing}
          />
          <InputField
            label="Municipality / City"
            value={formData.municipalityCity ?? ""}
            onChange={handleFieldChange("municipalityCity")}
            placeholder="e.g. Pavia"
            disabled={!isEditing}
          />
          <div className="col-span-1 sm:col-span-2">
            <InputField
              label="Province"
              value={formData.province ?? ""}
              onChange={handleFieldChange("province")}
              placeholder="e.g. Iloilo"
              disabled={!isEditing}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Last Name"
                value={formData.fatherLastName ?? ""}
                onChange={handleFieldChange("fatherLastName")}
                placeholder="e.g. Dela Cruz"
                disabled={!isEditing}
              />
              <InputField
                label="First Name"
                value={formData.fatherFirstName ?? ""}
                onChange={handleFieldChange("fatherFirstName")}
                placeholder="e.g. Juan"
                disabled={!isEditing}
              />
              <InputField
                label="Middle Name"
                value={formData.fatherMiddleName ?? ""}
                onChange={handleFieldChange("fatherMiddleName")}
                placeholder="e.g. Santos"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* [SECTION] Mother */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Mother's Maiden Name
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Last Name"
                value={formData.motherLastName ?? ""}
                onChange={handleFieldChange("motherLastName")}
                placeholder="e.g. Dela Cruz"
                disabled={!isEditing}
              />
              <InputField
                label="First Name"
                value={formData.motherFirstName ?? ""}
                onChange={handleFieldChange("motherFirstName")}
                placeholder="e.g. Maria"
                disabled={!isEditing}
              />
              <InputField
                label="Middle Name"
                value={formData.motherMiddleName ?? ""}
                onChange={handleFieldChange("motherMiddleName")}
                placeholder="e.g. Santos"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* [SECTION] Guardian */}
          <div>
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-500)] mb-2">
              Guardian's Name{" "}
              <span className="normal-case font-normal text-[var(--color-text-400)]">
                (if not Parent)
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Last Name"
                value={formData.guardianLastName ?? ""}
                onChange={handleFieldChange("guardianLastName")}
                placeholder="e.g. Dela Cruz"
                disabled={!isEditing}
              />
              <InputField
                label="First Name"
                value={formData.guardianFirstName ?? ""}
                onChange={handleFieldChange("guardianFirstName")}
                placeholder="e.g. Juan"
                disabled={!isEditing}
              />
              <InputField
                label="Middle Name"
                value={formData.guardianMiddleName ?? ""}
                onChange={handleFieldChange("guardianMiddleName")}
                placeholder="e.g. Santos"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* [FIELD] Contact Number */}
          <InputField
            label="Contact Number of Parent / Guardian"
            type="number"
            value={formData.contactNumber ?? ""}
            onChange={handleFieldChange("contactNumber")}
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

      {/* [LAYOUT] Admin Page */}
      <PageLayout
        header={
          <Breadcrumbs items={breadcrumbs} title="Student Details" />
        }
      >
        {student ? (
          <div className="space-y-4">

            {/* [COMPONENT] Profile Info */}
            <ProfileInfo lastName={student.lastName} firstName={student.firstName} />

            {/* [ACTIONS] Export + Delete */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full xl:w-auto xl:ml-auto">
              <PrimaryButton
                text="Export SF9"
                iconSrc="/export.svg"
                onClick={() => console.log("Exporting SF9... (not implemented)")}
              />
              <DeleteButton onClick={handleDelete} text="Delete Student" disabled={loading} />
            </div>

            {/* [COMPONENT] Student Details */}
            <TabbedFormCard
              labels={STUDENT_DETAILS_PAGE_LABELS}
              activePage={activePage}
              setActivePage={(p) => setActivePage(p as FormPage)}
              isEditing={isEditing}
              loading={loading}
              onSave={handleSave}
              onToggleEdit={handleEditToggle}
            >
              {renderFormPage()}
            </TabbedFormCard>

            {/* [CARD] Adviser */}
            <PersonInfoCard title="Adviser" person={student.adviser} />

            {/* [CARD] Enrollment History */}
            <EnrollmentHistoryCard enrollments={student.enrollments} />

            {/* [META] Registration date */}
            <p className="text-xs font-roboto text-[var(--color-text-500)] text-right">
              Registered{" "}
              {new Date(student.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

          </div>
        ) : (
          // [EMPTY STATE] Student not found
          <>
            <EmptyState
              title="Student not found"
              subtitle="The student you're looking for doesn't exist or may have been removed."
            />

            <button
              onClick={() => navigate("/admin/students")}
              className="mt-4 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to Students
            </button>
          </>
        )}
      </PageLayout>
    </>
  );
};

export default AdminStudentDetails;