// [IMPORT] Libraries
import React, { useState } from "react";

// [IMPORT] Components
import { StatusBadge } from "../StatusBadge";

// [IMPORT] Types
import type { SectionDetails } from "../../types";

// ? [TYPE] Student shape from SectionDetails
type Student = SectionDetails["students"][number];

interface StudentsListCardProps {
  students: Student[];
  classSize: number;
}

// [COMPONENT]
const StudentsListCard: React.FC<StudentsListCardProps> = ({ students, classSize }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  const totalPages = Math.ceil(students.length / studentsPerPage);
  const startIdx = (currentPage - 1) * studentsPerPage;
  const currentStudents = students.slice(startIdx, startIdx + studentsPerPage);

  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
      <p className="form-section-title">Students ({classSize})</p>

      {students.length === 0 ? (
        <p className="text-sm font-roboto text-[var(--color-text-600)]">
          No students enrolled.
        </p>
      ) : (
        <>
          {/* [LIST] Student rows */}
          <div className="flex flex-col gap-2">
            {currentStudents.map(student => (
              <div
                key={student.id}
                className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-sm font-roboto font-semibold text-[var(--color-text-900)] truncate">
                    {student.fullName}
                  </p>
                  <p className="text-xs font-mono text-[var(--color-text-500)]">
                    LRN {student.lrn}
                  </p>
                  <p className="text-xs font-roboto text-[var(--color-text-500)]">
                    {student.learningModality || "—"}
                  </p>
                </div>
                <StatusBadge status={student.status} />
              </div>
            ))}
          </div>

          {/* [UI] Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-roboto font-medium rounded-md border border-[var(--color-bg-300)] hover:bg-[var(--color-bg-200)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs font-roboto text-[var(--color-text-600)] flex items-center">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-roboto font-medium rounded-md border border-[var(--color-bg-300)] hover:bg-[var(--color-bg-200)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentsListCard;