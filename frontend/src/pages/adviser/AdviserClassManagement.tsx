import { useState, useEffect, useRef } from "react";
import ClassCard from "../../components/ClassCard";

const AdviserClassManagement = () => {
  // State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Mock data
  const classes = [
    {
      name: "7 — Polaris",
      classSize: 30,
      color: "#0066CC",
      schedule: [
        { day: "Mon", time: "8:00-9:00 AM" },
        { day: "Wed", time: "8:00-9:00 AM" },
        { day: "Fri", time: "10:00-11:00 AM" },
      ],
    },
    {
      name: "8 — Orion",
      classSize: 28,
      color: "#7C3AED",
      schedule: [
        { day: "Tue", time: "9:00-10:00 AM" },
        { day: "Thu", time: "9:00-10:00 AM" },
      ],
    },
    {
      name: "9 — Andromeda",
      classSize: 32,
      color: "#059669",
      schedule: [
        { day: "Mon", time: "1:00-2:00 PM" },
        { day: "Wed", time: "1:00-2:00 PM" },
      ],
    },
    {
    name: "10 — Pegasus",
    classSize: 29,
    color: "#DC2626",
    schedule: [
        { day: "Tue", time: "1:00-2:00 PM" },
        { day: "Thu", time: "1:00-2:00 PM" },
      ],
    },
  ];

  // Apply grade filter
  const filteredClasses = selectedGrade
    ? classes.filter((cls) => cls.name.startsWith(selectedGrade))
    : classes;

  return (
    <div className="py-6 px-4 space-y-4">

      {/* [SECTION] Header */}
      <div>
        <div className="bg-[var(--color-primary-700)] py-2 rounded-t-lg">
          <h1 className="text-center text-[var(--color-text-50)]">
            My Classes
          </h1>
        </div>
        <div className="bg-[var(--color-primary-600)] py-2 rounded-b-lg">
          <h4 className="text-center text-[var(--color-text-50)]">
            S.Y. 2025–2026
          </h4>
        </div>
      </div>

      {/* [SECTION] Search Bar & Filter Button */}
      <div className="flex items-center gap-4">

        {/* [COMPONENT] Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search classes..."
            className="
              w-full
              bg-[var(--color-bg-100)]
              border border-[var(--color-bg-400)]
              rounded-sm
              py-2 pl-4 pr-3
              outline-none
              focus:ring-2
              focus:ring-[var(--color-primary-600)]
              text-sm
            "
          />
        </div>

        {/* [COMPONENT] Filter Button + Dropdown */}
        <div ref={filterRef} className="relative">

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center justify-center
              rounded-sm
              p-2
              border
              transition
              cursor-pointer
              ${
                showFilters
                  ? "bg-[var(--color-primary-600)] border-[var(--color-primary-500)]"
                  : "bg-[var(--color-primary-700)] border-[var(--color-primary-700)] hover:opacity-80"
              }
            `}
          >
            <img
              src="/filter-icon.svg"
              alt="Filter"
              className="w-5 h-5"
            />
          </button>

            {/* Filter Dropdown */}
            {showFilters && (
            <div
                className="
                absolute right-0 mt-2
                w-56
                bg-[var(--color-bg-100)]
                border border-[var(--color-bg-300)]
                rounded-md
                shadow-lg
                p-3
                space-y-2
                z-50
                "
            >
                <p className="text-sm font-semibold text-[var(--color-text-700)]">
                Filter by Grade
                </p>

                <button
                onClick={() => {
                    setSelectedGrade(null);
                    setShowFilters(false);
                }}
                className={`
                    w-full text-left px-2 py-1 rounded
                    hover:bg-[var(--color-bg-200)]
                    ${selectedGrade === null ? "bg-[var(--color-primary-200)]" : ""}
                `}
                >
                All
                </button>

                {/* Grade Options */}
                {["7", "8", "9", "10"].map((grade) => (
                <button
                    key={grade}
                    onClick={() => {
                    setSelectedGrade(grade);
                    setShowFilters(false);
                    }}
                    className={`
                    w-full text-left px-2 py-1 rounded
                    hover:bg-[var(--color-bg-200)]
                    ${selectedGrade === grade ? "bg-[var(--color-primary-200)]" : ""}
                    `}
                >
                    Grade {grade}
                </button>
                ))}
            </div>
            )}
        </div>
      </div>

      {/* [SECTION] Class Cards */}
      <div className="grid grid-cols-1 space-y-6 py-4">
        {filteredClasses.map((cls, index) => (
          <ClassCard
            key={index}
            name={cls.name}
            schedule={cls.schedule}
            classSize={cls.classSize}
            color={cls.color}
          />
        ))}
      </div>

    </div>
  );
};

export default AdviserClassManagement;