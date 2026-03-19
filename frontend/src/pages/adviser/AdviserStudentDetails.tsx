import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";

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

const AdviserStudentDetails = () => {
  const { id: sectionId, studentId } = useParams<{ id: string; studentId: string }>();
  const navigate = useNavigate();

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
  const { setShowTokenExpiredModal } = useAuth();

  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      setShowTokenExpiredModal(true);
      return null;
    }
    return await res.json();
  };

  const handleChange = (field: keyof StudentForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEdit = () => {
    if (isEditing && originalForm) {
      setForm(originalForm);
    } else if (!isEditing) {
      setOriginalForm(form);
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    if (!form) return;

    const requiredFields: (keyof StudentForm)[] = [
      "lastName",
      "firstName",
      "sex",
      "birthDate",
      "learningModality",
    ];
    const missingFields = requiredFields.filter(
      (field) => !form[field] || form[field]?.toString().trim() === ""
    );

    if (missingFields.length > 0) {
      setModalTitle("Validation Error");
      setModalMessage(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      setModalType("error");
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    if (form.age !== undefined && (isNaN(form.age) || form.age < 0)) {
      setModalTitle("Validation Error");
      setModalMessage("Please enter a valid non-negative age.");
      setModalType("error");
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    if (form.guardianContact && !/^\d+$/.test(form.guardianContact)) {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { age, ...payload } = form;

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

      const data = await handleApiResponse(res);
      if (!data) return;

      if (!data.success) {
        setModalTitle("Save Failed");
        setModalMessage(data.message || "Failed to save student data.");
        setModalType("error");
        setRedirectOnConfirm(false);
        setShowModal(true);
        return;
      }

      // On success
      setModalTitle("Success");
      setModalMessage("Student details saved successfully!");
      setModalType("success");
      setRedirectOnConfirm(false);
      setShowModal(true);
      setIsEditing(false);
      setOriginalForm(form);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(errorMessage || "Something went wrong while saving.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function
  const formatFullName = (student: Student) => {
    const first = student.firstName ?? "";
    const middleInitial = student.middleName ? `${student.middleName.charAt(0)}.` : "";
    const last = student.lastName ?? "";
    const extension = student.nameExtension ? ` ${student.nameExtension}` : "";

    return [first, middleInitial, last, extension].filter(Boolean).join(" ");
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  // Placeholder SF9 generator
  const handleGenerateSF9 = () => {
    alert("SF9 generation not implemented yet.");
  };

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

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      age: calculateAgeFromBirthDate(prev.birthDate),
    }));
  }, [form.birthDate]);

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

        const data = await handleApiResponse(res);
        if (!data) return;

        if (!data.success || !data.data) {
          setError(data.message || "Failed to fetch student data");
          setStudent(null);
          return;
        }

        const studentData = data.data;

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
          sex: studentData.sex ?? "",
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
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || "Something went wrong");
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, studentId]);

  if (loading) return <p>Loading student details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!student) return <p>Student not found.</p>;

  const LEARNING_MODALITIES = [
    { label: "Face to Face", value: "FACE_TO_FACE" },
    { label: "Distance Learning", value: "DISTANCE_LEARNING" },
    { label: "Blended", value: "BLENDED" },
    { label: "Online", value: "ONLINE" },
    { label: "Homeschool", value: "HOMESCHOOL" },
    { label: "Other", value: "OTHER" },
  ];

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
    <div className="py-8 px-4 space-y-4">
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            if (redirectOnConfirm) navigate("/adviser/classes"); // optional redirect
          }}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
        />
      )}
      {/* Breadcrumbs */}
      <nav className="font-roboto text-sm text-[var(--color-text-700)] px-2 pb-2">
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            {crumb.path ? (
              <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>
                {crumb.label}
              </span>
            ) : (
              <span className="font-roboto font-medium text-[var(--color-text-900)]">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && " / "}
          </span>
        ))}
      </nav>

      {/* Student Card (Profile + Full Name + Details Table) */}
      <div className="bg-[var(--color-bg-50)] shadow-lg rounded-lg flex flex-col md:flex-row md:items-start gap-y-4">
        <div className="flex justify-center items-center text-center pt-4">
          {/* Left: Profile Picture */}
          <img
            src={student.profilePic ?? "/default-profile.png"}
            alt=""
            className="w-24 h-24 rounded-full object-cover bg-[var(--color-bg-400)] flex-shrink-0"
          />
        </div>

        {/* Right: Name + Details */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Full Name */}
          <p className="font-figtree font-bold text-xl text-[var(--color-text-900)] md:text-left text-center">
            {formatFullName(student)}
          </p>

          {/* Details Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse font-roboto text-[var(--color-text-900)]">
              <tbody>
                <tr className="border-t border-[var(--color-bg-200)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[50px]">LRN</td>
                  <td className="py-2 pl-2 text-sm">{student.lrn}</td>
                </tr>
                <tr className="border-t border-[var(--color-bg-200)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[50px]">Email</td>
                  <td className="py-2 pl-2 text-sm">{student.email ?? "-"}</td>
                </tr>
                <tr className="border-t border-[var(--color-bg-200)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[50px]">Sex</td>
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
                <tr className="border-t border-[var(--color-bg-200)]">
                  <td className="py-2 pl-4 font-semibold text-sm min-w-[50px]">Birth Date</td>
                  <td className="py-2 pl-2 text-sm">
                    {student.birthDate ? new Date(student.birthDate).toLocaleDateString() : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate SF9 */}
      <PrimaryButton text="Generate SF9" onClick={handleGenerateSF9} />

      {/* Multi-page form */}
      <div className="shadow-lg rounded-xl p-6 bg-[var(--color-bg-100)] space-y-2">
        {/* Pagination */}
        <div className="flex justify-between items-center space-x-4 pb-2">
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

          <span className="flex gap-x-1 text-sm text-[var(--color-text-900)] font-medium">
            Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
          </span>

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

        {/* Edit / Cancel */}
        <div className="flex justify-end gap-2">
          <button
            onClick={toggleEdit}
            className="flex items-center gap-2 rounded-md text-sm px-4 py-2 bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] transition text-[var(--color-text-50)] font-roboto font-medium"
          >
            {isEditing ? "Cancel" : "Edit"}

            {!isEditing && (
              <img
                src="/edit-icon.svg"
                className="w-4 h-4 object-contain"
                alt="edit icon"
              />
            )}
          </button>

          {/* Save — only visible in edit mode */}
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-md text-sm px-4 py-2 bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-500)] transition text-white font-roboto font-medium"
            >
              Save
            </button>
          )}
        </div>

        {/* Form Pages */}
        {page === 1 && (
          <>
            <h3 className="pb-2 font-semibold">Basic Information</h3>
            <InputField label="Last Name" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} disabled={!isEditing} />
            <InputField label="First Name" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} disabled={!isEditing} />
            <InputField label="Middle Name" value={form.middleName ?? ""} onChange={(e) => handleChange("middleName", e.target.value)} disabled={!isEditing} />
            <InputField label="Sex (M/F)" type="select" value={form.sex ?? ""} onChange={(e) => handleChange("sex", e.target.value)} options={["M", "F"]} placeholder="Select sex" disabled={!isEditing} />
            <InputField label="Birth Date" type="date" value={form.birthDate ?? ""} onChange={(e) => handleChange("birthDate", e.target.value)} disabled={!isEditing} />
            <InputField label="Age" type="number" value={form.age ?? ""} onChange={(e) => { const val = e.target.value; handleChange("age", val !== "" ? parseInt(val) : 0); }} maxLength={3} disabled={true} />
            <InputField label="Mother Tongue" value={form.motherTongue ?? ""} onChange={(e) => handleChange("motherTongue", e.target.value)} disabled={!isEditing} />
            <InputField label="IP (Ethnic Group)" value={form.ip ?? ""} onChange={(e) => handleChange("ip", e.target.value)} disabled={!isEditing} />
            <InputField label="Religion" value={form.religion ?? ""} onChange={(e) => handleChange("religion", e.target.value)} disabled={!isEditing} />
          </>
        )}

        {page === 2 && (
          <>
            <h3 className="pb-2 font-semibold">Address</h3>
            <div className="grid grid-cols-2 gap-2">
              <InputField label="House #" value={form.houseNo ?? ""} onChange={(e) => handleChange("houseNo", e.target.value)} disabled={!isEditing} />
              <InputField label="Street" value={form.street ?? ""} onChange={(e) => handleChange("street", e.target.value)} disabled={!isEditing} />
              <InputField label="Sitio" value={form.sitio ?? ""} onChange={(e) => handleChange("sitio", e.target.value)} disabled={!isEditing} />
              <InputField label="Purok" value={form.purok ?? ""} onChange={(e) => handleChange("purok", e.target.value)} disabled={!isEditing} />
            </div>
            <InputField label="Barangay" value={form.barangay ?? ""} onChange={(e) => handleChange("barangay", e.target.value)} disabled={!isEditing} />
            <InputField label="Municipality / City" value={form.municipality ?? ""} onChange={(e) => handleChange("municipality", e.target.value)} disabled={!isEditing} />
            <InputField label="Province" value={form.province ?? ""} onChange={(e) => handleChange("province", e.target.value)} disabled={!isEditing} />
          </>
        )}

        {page === 3 && (
          <>
            <h3 className="pb-2 font-semibold">Parents / Guardian</h3>
            <InputField label="Father's Name" value={form.fatherName ?? ""} onChange={(e) => handleChange("fatherName", e.target.value)} disabled={!isEditing} />
            <InputField label="Mother's Maiden Name" value={form.motherName ?? ""} onChange={(e) => handleChange("motherName", e.target.value)} disabled={!isEditing} />
            <InputField label="Guardian's Name" value={form.guardianName ?? ""} onChange={(e) => handleChange("guardianName", e.target.value)} disabled={!isEditing} />
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
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdviserStudentDetails;