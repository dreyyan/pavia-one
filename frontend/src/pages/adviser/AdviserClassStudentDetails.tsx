// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

// ?[INTERFACES]
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
  profilePic?: string;
  sectionId?: number;
  sectionName?: string;
  gradeLevel?: number;
}

interface StudentForm {
  lastName: string;
  firstName: string;
  middleName?: string;
  sex?: string;
  birthDate?: string;
  age?: number;
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

const AdviserClassStudentDetails = () => {
  const { sectionId, studentId } = useParams<{
    sectionId: string;
    studentId: string;
  }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>({
    lastName: "",
    firstName: "",
    middleName: "",
    sex: "",
    birthDate: "",
    age: undefined,
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

  const [originalForm, setOriginalForm] = useState<StudentForm | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = 3;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "error" | "success" | "info" | "warning">("default");
  const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

  // [HANDLE] Student form update
  const handleChange = (field: keyof StudentForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // [HANDLE] Toggle form edit state
  const toggleEdit = () => {
    if (isEditing && originalForm) {
      setForm(originalForm);
    } else if (!isEditing) {
      setOriginalForm(form);
    }
    setIsEditing((prev) => !prev);
  };

  // [HANDLE] Form navigation
  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  // *[HANDLE] Form save
  const handleSave = async () => {
    if (!form) return;

    const requiredFields: (keyof StudentForm)[] = [
      "lastName",
      "firstName",
      "sex",
      "birthDate",
      "learningModality",
    ];

    // *[VALIDATION] Check for missing required fields
    const missingFields = requiredFields.filter(
      (field) => !form[field] || form[field]?.toString().trim() === ""
    );

    if (missingFields.length > 0) {
      // ![ERROR] Missing required fields
      setModalTitle("Validation Error");
      setModalMessage(
        `Please fill in the following required fields: ${missingFields.join(", ")}`
      );
      setModalType("error");
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    // *[VALIDATION] Check for invalid age
    if (form.age !== undefined && (isNaN(form.age) || form.age < 0)) {
      // ![ERROR] Invalid age
      setModalTitle("Validation Error");
      setModalMessage("Please enter a valid non-negative age.");
      setModalType("error");
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    // *[VALIDATION] Check guardian contact number
    if (form.guardianContact && !/^\d+$/.test(form.guardianContact)) {
      // ![ERROR] Invalid guardian contact no.
      setModalTitle("Validation Error");
      setModalMessage("Guardian contact number should contain only digits.");
      setModalType("error");
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      // *[PREP] Remove `age` from payload if present
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { age, ...payload } = form;

      // *[API] Send PUT request to update student
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      // ![ERROR] Backend failure or missing data
      if (!data.success) {
        setModalTitle("Save Failed");
        setModalMessage(data.message || "Failed to save student data.");
        setModalType("error");
        setRedirectOnConfirm(false);
        setShowModal(true);
        return;
      }

      // *[SUCCESS] Student saved
      setModalTitle("Success");
      setModalMessage("Student details saved successfully!");
      setModalType("success");
      setRedirectOnConfirm(false);
      setShowModal(true);
      setIsEditing(false);
      setOriginalForm(form);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("Something went wrong while saving.");
      setModalType("error");
      setRedirectOnConfirm(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // [HELPER] Format student full name
  const formatFullName = (student: Student) => {
    const first = student.firstName ?? "";
    const middleInitial = student.middleName ? `${student.middleName.charAt(0)}.` : "";
    const last = student.lastName ?? "";
    const extension = student.nameExtension ? ` ${student.nameExtension}` : "";

    return [first, middleInitial, last, extension].filter(Boolean).join(" ");
  };

  // [HELPER] Calculate age using birthdate
  const calculateAgeFromBirthDate = (birthDate?: string) => {
    if (!birthDate) return undefined;

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 0 ? age : undefined;
  };

  // TODO [HANDLE] Generate SF9
  const handleGenerateSF9 = () => {
    alert("SF9 generation not implemented yet.");
  };

  // *[EFFECT] Fetch student's birthdate
  useEffect(() => {
    if (form.birthDate) {
      setForm((prev) => ({
        ...prev,
        age: calculateAgeFromBirthDate(prev.birthDate),
      }));
    }
  }, [form.birthDate]);

  // *[EFFECT] Fetch student information
  useEffect(() => {
    const fetchStudent = async () => {
      if (!sectionId || !studentId) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}/students/${studentId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // ![ERROR] Expired token
        if (res.status === 401) {
          setShowTokenExpiredModal(true);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const studentData = data.data;

        console.log("Fetched student data:", studentData);

        // ![ERROR] Backend failure or missing data
        if (!data.success || !data.data) {
          setError(data.message || "Failed to fetch student data");
          setStudent(null);
          return;
        }

        // Fetch student details
        const studentFlat: Student = {
          ...studentData,
          sectionName: studentData.sectionName ?? "",
          gradeLevel: studentData.gradeLevel ?? undefined,
          sectionId: studentData.sectionId ?? undefined,
        };

        setStudent(studentFlat);

        const prefillForm: StudentForm = {
          lastName: studentData.lastName ?? "",
          firstName: studentData.firstName ?? "",
          middleName: studentData.middleName ?? "",
          sex:
            studentData.sex?.toUpperCase() === "MALE"
              ? "M"
              : studentData.sex?.toUpperCase() === "FEMALE"
              ? "F"
              : "",
          birthDate: studentData.birthDate ?? "",
          age: calculateAgeFromBirthDate(studentData.birthDate),
          motherTongue: studentData.motherTongue ?? "",
          ip: studentData.ip ?? "",
          religion: studentData.religion ?? "",
          houseNo: studentData.houseNo ?? "",
          street: studentData.street ?? "",
          sitio: studentData.sitio ?? "",
          purok: studentData.purok ?? "",
          barangay: studentData.barangay ?? "",
          municipality: studentData.municipality ?? "",
          province: studentData.province ?? "",
          fatherName: studentData.fatherName ?? "",
          motherName: studentData.motherName ?? "",
          guardianName: studentData.guardianName ?? "",
          guardianRelationship: studentData.guardianRelationship ?? "",
          guardianContact: studentData.guardianContact ?? "",
          learningModality: studentData.learningModality ?? "",
        };

        setForm(prefillForm);
        setOriginalForm(prefillForm);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Something went wrong");
        setError(error.message);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [sectionId, studentId, setShowTokenExpiredModal]);

  if (loading) return <p>Loading student details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!student) return <p>Student not found.</p>;

  // [DATA] Learning Modalities
  const LEARNING_MODALITIES = [
    { label: "Face to Face", value: "FACE_TO_FACE" },
    { label: "Distance Learning", value: "DISTANCE_LEARNING" },
    { label: "Blended", value: "BLENDED" },
    { label: "Online", value: "ONLINE" },
    { label: "Homeschool", value: "HOMESCHOOL" },
    { label: "Other", value: "OTHER" },
  ];

  // Breadcrumbs navigation
  const breadcrumbs = [
    { label: "Class Management", path: "/adviser/classes" },
    {
      label: `${student.gradeLevel ?? "?"} — ${student.sectionName ?? "Section"}`,
      path: student.sectionId ? `/adviser/classes/${student.sectionId}` : undefined,
    },
    { label: "View Students", path: `/adviser/classes/${student.sectionId}/students` },
    { label: student.fullName, path: null },
  ];

  return (
    <div className="py-10 px-4 space-y-4">
      {/* [COMPONENT] Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            if (redirectOnConfirm) navigate("/adviser/classes");
          }}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
        />
      )}
      {/* [SECTION] Header & Breadcrumbs */}
      <div>
        <h2 className="text-[var(--color-text-800)] leading-0">Student Details</h2>
        <nav className="font-roboto text-sm text-[var(--color-text-700)]">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx}>
              {crumb.path ? (
                <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>
                  {crumb.label}
                </span>
              ) : (
                <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && " / "}
            </span>
          ))}
        </nav>
      </div>

      {/* [SECTION] Student Information */}
      <div className="p-4 bg-[var(--color-bg-50)] shadow-lg rounded-lg flex flex-col md:flex-row md:items-start gap-y-4">
        {/* [SECTION] Name + Details */}
        <div className="flex-1 flex flex-col gap-4">
          {/* [UI] Full Name */}
          <p className="font-figtree font-bold text-xl text-[var(--color-text-900)] md:text-left text-center">
            {formatFullName(student)}
          </p>

          {/* [SECTION] Details Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse font-roboto text-[var(--color-text-900)]">
              <colgroup>
                <col className="w-22" />
                <col />
              </colgroup>
              <tbody>
                <tr className="border-t border-[var(--color-bg-200)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[40px]">LRN</td>
                  <td className="py-2 pl-2 text-sm">{student.lrn}</td>
                </tr>
                <tr className="border-t border-[var(--color-bg-100)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[40px]">Email</td>
                  <td className="py-2 pl-2 text-sm">{student.email ?? "-"}</td>
                </tr>
                <tr className="border-t border-[var(--color-bg-100)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[40px]">Sex</td>
                  <td className="py-2 pl-2 text-sm">
                    {student.sex
                      ? student.sex.toUpperCase() === "MALE"
                        ? "M"
                        : student.sex.toUpperCase() === "FEMALE"
                        ? "F"
                        : student.sex
                      : "-"}
                  </td>
                </tr>
                <tr className="border-t border-[var(--color-bg-100)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[40px]">Birth Date</td>
                  <td className="py-2 pl-2 text-sm">
                    {student.birthDate ? new Date(student.birthDate).toLocaleDateString() : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* [PRIMARY BUTTON] Generate SF9 */}
      <PrimaryButton text="Generate SF9" onClick={handleGenerateSF9} iconSrc="/generate-file-icon-white.svg" />

      {/* [SECTION] Multi-page Student Information */}
      <div className="shadow-lg rounded-xl p-6 bg-[var(--color-bg-100)] space-y-2">
        {/* [SECTION] Pagination */}
        <div className="flex justify-between items-center space-x-4">
          {/* [BUTTON] Previous */}
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === 1
                ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
                : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            &lt; Previous
          </button>

          {/* [UI] Page Number */}
          <span className="flex gap-x-1 text-sm text-[var(--color-text-900)] font-medium">
            Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
          </span>

          {/* [BUTTON] Next */}
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`w-24 py-2 rounded-md text-[var(--color-text-50)] font-roboto text-xs font-semibold transition-colors duration-150 ${
              page === totalPages
                ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50"
                : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            Next &gt;
          </button>
        </div>

        {/* [UI] Separator */}
        <hr className="my-4 text-[var(--color-text-300)]"/>

        {/* [BUTTON] Edit / Cancel */}
        <div className="flex justify-end gap-4">
          <button
            onClick={toggleEdit}
            className="flex items-center gap-2 rounded-md text-sm px-4 py-2 bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] transition text-[var(--color-text-50)] font-roboto font-medium"
          >
            {isEditing ? "Cancel" : "Edit"}

            {!isEditing && (
              <img
                src="/edit-icon.svg"
                className="size-4 object-contain"
                alt="edit icon"
              />
            )}
          </button>

          {/* [BUTTON] Save */}
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-md text-sm px-4 py-2 bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] transition text-white font-roboto font-medium"
            >
              Save
            </button>
          )}
        </div>

        {/* [SECTION] Form Pages */}
        {page === 1 && (
          <>
            <h3 className="pb-2 font-semibold">Basic Information</h3>
            <div className="space-y-3">
              <InputField label="Last Name" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} disabled={!isEditing} required />
              <InputField label="First Name" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} disabled={!isEditing} required />
              <InputField label="Middle Name" value={form.middleName ?? ""} onChange={(e) => handleChange("middleName", e.target.value)} disabled={!isEditing} required />
              <InputField label="Sex (M/F)" type="select" value={form.sex ?? ""} onChange={(e) => handleChange("sex", e.target.value)} options={["M", "F"]} placeholder="Select sex" disabled={!isEditing} required />
              <div className="flex gap-x-4">
                <InputField label="Birth Date" type="date" value={form.birthDate ?? ""} onChange={(e) => handleChange("birthDate", e.target.value)} disabled={!isEditing} required />
                <InputField label="Age" type="number" value={form.age ?? ""} onChange={(e) => { const val = e.target.value; handleChange("age", val !== "" ? parseInt(val) : 0); }} maxLength={3} disabled={true} />
              </div>
              <InputField label="Mother Tongue" value={form.motherTongue ?? ""} onChange={(e) => handleChange("motherTongue", e.target.value)} disabled={!isEditing} required />
              <InputField label="IP (Ethnic Group)" value={form.ip ?? ""} onChange={(e) => handleChange("ip", e.target.value)} disabled={!isEditing} />
              <InputField label="Religion" value={form.religion ?? ""} onChange={(e) => handleChange("religion", e.target.value)} disabled={!isEditing} required />
            </div>
          </>
        )}

        {page === 2 && (
          <>
            <h3 className="pb-2 font-semibold">Address</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 gap-x-4">
                <InputField label="House #" value={form.houseNo ?? ""} onChange={(e) => handleChange("houseNo", e.target.value)} disabled={!isEditing} />
                <InputField label="Street" value={form.street ?? ""} onChange={(e) => handleChange("street", e.target.value)} disabled={!isEditing} />
                <InputField label="Sitio" value={form.sitio ?? ""} onChange={(e) => handleChange("sitio", e.target.value)} disabled={!isEditing} />
                <InputField label="Purok" value={form.purok ?? ""} onChange={(e) => handleChange("purok", e.target.value)} disabled={!isEditing} />
              </div>

              <InputField label="Barangay" value={form.barangay ?? ""} onChange={(e) => handleChange("barangay", e.target.value)} disabled={!isEditing} required />
              <InputField label="Municipality / City" value={form.municipality ?? ""} onChange={(e) => handleChange("municipality", e.target.value)} disabled={!isEditing} required />
              <InputField label="Province" value={form.province ?? ""} onChange={(e) => handleChange("province", e.target.value)} disabled={!isEditing} required />
            </div>
          </>
        )}

        {page === 3 && (
          <>
            <h3 className="pb-2 font-semibold">Parents / Guardian</h3>
            <div className="space-y-3">
              <InputField label="Father's Name" sublabel="(Last Name, First Name, Middle Name)" value={form.fatherName ?? ""} onChange={(e) => handleChange("fatherName", e.target.value)} disabled={!isEditing} required />
              <InputField label="Mother's Maiden Name" sublabel="(Last Name, First Name, Middle Name)" value={form.motherName ?? ""} onChange={(e) => handleChange("motherName", e.target.value)} disabled={!isEditing} required />
              <InputField label="Guardian's Name" sublabel="(Last Name, First Name, Middle Name)" value={form.guardianName ?? ""} onChange={(e) => handleChange("guardianName", e.target.value)} disabled={!isEditing} />
              <InputField label="Relationship" value={form.guardianRelationship ?? ""} onChange={(e) => handleChange("guardianRelationship", e.target.value)} disabled={!isEditing} />
              <InputField label="Contact Number" value={form.guardianContact ?? ""} onChange={(e) => handleChange("guardianContact", e.target.value)} disabled={!isEditing} />
              <InputField
                label="Learning Modality"
                type="select"
                value={LEARNING_MODALITIES.find(m => m.value === form.learningModality)?.label ?? ""}
                onChange={(e) => {
                  const selectedLabel = e.target.value;
                  const modality = LEARNING_MODALITIES.find(m => m.label === selectedLabel);
                  handleChange("learningModality", modality?.value ?? "");
                }}
                options={LEARNING_MODALITIES.map(m => m.label)}
                placeholder="Select learning modality"
                disabled={!isEditing}
                required
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdviserClassStudentDetails;