import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import Breadcrumbs from "../../components/Breadcrumbs";
import ClassCard from "../../components/cards/ClassCard";
import StudentGradeCard from "../../components/cards/StudentGradeCard";
import PageLayout from "../../components/layouts/PageLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import Dropdown from "../../components/Dropdown";

import { GeneralModalConfig } from "../../types";
import { getVisiblePages } from "../../helpers";

interface StudentGrade {
  id: number;
  lrn: string;
  fullName: string;
  average: number | null;
  remarks: string | null;
}

interface SectionInfo {
  id: number;
  name: string;
  gradeLevel: number;
  classSize: number;
  maleCount: number;
  femaleCount: number;
  color: string;
}

interface Enrollment {
  student?: { sex?: "MALE" | "FEMALE" | null } | null;
}

const AdviserClassGrades = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeDropdown, setActiveDropdown] =
    useState<"sort" | "filter" | null>(null);

  type SortOption = "name-asc" | "name-desc" | "lrn-asc" | "lrn-desc";
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const [selectedSexes, setSelectedSexes] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(5);

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

  const fetchGrades = async () => {
    if (!sectionId) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const resSection = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resSection.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }

      const sectionData = await resSection.json();
      if (!sectionData?.success) throw new Error();

      const sec = sectionData.data;

      let maleCount = 0;
      let femaleCount = 0;

      (sec.enrollments || []).forEach((e: Enrollment) => {
        const sex = e.student?.sex;
        if (sex === "MALE") maleCount++;
        if (sex === "FEMALE") femaleCount++;
      });

      setSection({
        id: sec.id,
        gradeLevel: Number(sec.gradeLevel),
        name: `${sec.gradeLevel} — ${sec.name}`,
        classSize: sec.classSize ?? maleCount + femaleCount,
        maleCount,
        femaleCount,
        color: sec.color ?? "#999999",
      });

      const resGrades = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/grades/section/${sectionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const gradesData = await resGrades.json();
      if (!gradesData?.success) throw new Error();

      setGrades(gradesData.data || []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Grades",
        message:
          "We couldn't load the grades at the moment. Please try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: closeGeneralModal,
      });
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

const filteredGrades = grades
  .filter(s => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.lrn.includes(search);

    const matchesSex =
      selectedSexes.length === 0 ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedSexes.includes((s as any).sex);

    return matchesSearch && matchesSex;
  })
  .sort((a, b) => {
    switch (sortOption) {
      case "name-asc":
        return a.fullName.localeCompare(b.fullName);
      case "name-desc":
        return b.fullName.localeCompare(a.fullName);
      case "lrn-asc":
        return a.lrn.localeCompare(b.lrn);
      case "lrn-desc":
        return b.lrn.localeCompare(a.lrn);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);

  const displayedGrades = filteredGrades.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const breadcrumbs = [
    { label: "Adviser Dashboard", path: "/adviser/dashboard" },
    { label: "Class Management", path: "/adviser/classes" },
    { label: section?.name ?? "Class", path: `/adviser/classes/${sectionId}` },
    { label: "Grades", path: null },
  ];

  if (loading) return <Skeleton />;

  return (
    <>
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

      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="Grades" />}
        toolbar={
          <div className="space-y-4">
            {section && (
              <ClassCard
                id={section.id}
                name={section.name}
                classSize={section.classSize}
                maleCount={section.maleCount}
                femaleCount={section.femaleCount}
                gradeLevel={section.gradeLevel}
              />
            )}
            <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full">
                <div className="flex items-stretch gap-2 md:gap-4 w-full">

                  {/* [COMPONENT] Search Bar */}
                  <div className="w-full sm:w-64 md:w-80 lg:w-96">
                    <SearchBar
                      value={search}
                      placeholder="Search by name or LRN..."
                      onChange={setSearch}
                      onResetPage={() => setPage(1)}
                    />
                  </div>

                  {/* [COMPONENT] Sort Dropdown */}
                  <div className="flex gap-x-2 ml-auto shrink-0">
                    <Dropdown
                      icon="/sort.svg"
                      label="Sort"
                      isOpen={activeDropdown === "sort"}
                      onToggle={() =>
                        setActiveDropdown(activeDropdown === "sort" ? null : "sort")
                      }
                      selected={sortOption}
                      onSelect={(v) => {
                        setSortOption(v as SortOption);
                        setPage(1);
                      }}
                      options={[
                        { label: "Name (A → Z)", value: "name-asc" },
                        { label: "Name (Z → A)", value: "name-desc" },
                        { label: "LRN ↑", value: "lrn-asc" },
                        { label: "LRN ↓", value: "lrn-desc" },
                      ]}
                    />
                    {/* [COMPONENT] Filter Dropdown */}
                    <Dropdown
                      icon="/filter.svg"
                      label="Filter"
                      isOpen={activeDropdown === "filter"}
                      onToggle={() =>
                        setActiveDropdown(activeDropdown === "filter" ? null : "filter")
                      }
                      groups={[
                        {
                          label: "Sex",
                          options: [
                            { label: "Male", value: "MALE" },
                            { label: "Female", value: "FEMALE" },
                          ],
                          selectedValues: selectedSexes,
                          onSelectMultiple: (v) => {
                            setSelectedSexes(v);
                            setPage(1);
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        footer={
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            getVisiblePages={getVisiblePages}
          />
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
            {!loading && displayedGrades.length === 0 && (
              <div className="sm:col-span-2 flex justify-center">
                <EmptyState
                  title="No grades available"
                  subtitle="Grades will appear once uploaded."
                />
              </div>
            )}

            {displayedGrades.map(student => (
              <StudentGradeCard
                key={student.id}
                student={student}
                onClick={() =>
                  navigate(
                    `/adviser/classes/grades/${sectionId}/${student.id}`
                  )
                }
              />
            ))}
          </div>

          <div className="hidden md:block bg-[var(--color-bg-100)] px-3 py-4 rounded-lg overflow-x-auto">
            {!loading && displayedGrades.length === 0 && (
              <EmptyState
                title="No grades available"
                subtitle="Grades will appear once uploaded."
              />
            )}

            {displayedGrades.length > 0 && (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="table-header">LRN</th>
                    <th className="table-header">Full Name</th>
                    <th className="table-header">Average</th>
                    <th className="table-header">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedGrades.map(student => (
                    <tr
                      key={student.id}
                      className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/adviser/classes/grades/${sectionId}/${student.id}`
                        )
                      }
                    >
                      <td className="table-cell">{student.lrn}</td>
                      <td className="table-cell table-text-link">
                        {student.fullName}
                      </td>
                      <td className="table-cell">
                        {student.average ?? "—"}
                      </td>
                      <td className="table-cell">
                        {student.remarks ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default AdviserClassGrades;