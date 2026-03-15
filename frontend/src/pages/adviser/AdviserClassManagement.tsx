import ClassCard from "../../components/ClassCard";

const AdviserClassManagement = () => {
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
    ];

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
            {/* Search Input */}
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

            {/* Filter Button */}
            <button
            className="
                flex items-center justify-center
                bg-[var(--color-primary-700)]
                rounded-sm
                p-2
                hover:opacity-80
                transition
                cursor-pointer
            "
            >
            <img
                src="/filter-icon.svg"
                alt="Filter"
                className="w-5 h-5"
            />
            </button>
        </div>

        {/* [SECTION] Class Cards */}
        <div className="grid grid-cols-1 space-y-6 py-4">
            {classes.map((cls, index) => (
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