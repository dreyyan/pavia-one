import { useNavigate } from "react-router-dom";

interface ClassCardProps {
  id: number;
  name: string;
  schedule?: { day: string; time: string }[];
  classSize: number;
  color: string;
  sf1_status?: string;
  sf2_status?: string;
  sf5_status?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  name,
  schedule,
  classSize,
  color,
  sf1_status,
  sf2_status,
  sf5_status,
}) => {
  const navigate = useNavigate();

  const handleClassCard = () => {
    const hasSfStatus = sf1_status || sf2_status || sf5_status;
    const path = hasSfStatus ? `/adviser/school-forms/${id}` : `/adviser/classes/${id}`;
    navigate(path);
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "Complete":
        return {
          bg: "bg-[var(--color-accent-100)]",
          text: "text-[var(--color-accent-800)]",
          dot: "bg-[var(--color-accent-600)]",
        };
      case "Pending":
        return {
          bg: "bg-[var(--color-secondary-100)]",
          text: "text-[var(--color-secondary-800)]",
          dot: "bg-[var(--color-secondary-500)]",
        };
      default:
        return {
          bg: "bg-[var(--color-bg-100)]",
          text: "text-[var(--color-text-600)]",
          dot: "bg-[var(--color-bg-400)]",
        };
    }
  };

  const sfStatuses = [
    { key: "SF1", value: sf1_status },
    { key: "SF2", value: sf2_status },
    { key: "SF5", value: sf5_status },
  ].filter((s) => s.value);

  return (
    <button
      style={{ backgroundColor: color }}
      onClick={handleClassCard}
      className="
        relative rounded-lg
        pt-4 pb-3 px-4
        space-y-2
        cursor-pointer
        transition-opacity hover:opacity-80
        shadow-md w-full text-left
      "
    >
      {/* Class Size Badge */}
      <div
        style={{ borderColor: color }}
        className="
          absolute top-[-16px] right-4
          flex items-center gap-1
          bg-[var(--color-bg-50)]
          border-3 rounded-sm
          px-2 py-1
        "
      >
        <p style={{ color: color }} className="font-roboto font-semibold text-sm">
          {classSize}
        </p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill={color}
          viewBox="0 0 24 24"
          stroke="none"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>

      {/* Class Section Name */}
      <h2 className="text-left text-[var(--color-text-50)] font-semibold">
        {name}
      </h2>

      {/* Class Schedule */}
      {schedule && schedule.length > 0 && (
        <div>
          {schedule.map(({ day, time }, index) => (
            <div key={index} className="flex justify-between [&>p]:text-[var(--color-text-50)]">
              <p className="font-roboto font-bold text-sm leading-normal tracking-wider">{day}</p>
              <p className="font-roboto font-medium text-sm leading-normal">{time}</p>
            </div>
          ))}
        </div>
      )}

      {/* SF Status Row */}
      {sfStatuses.length > 0 && (
        <div className="border-t border-white/30 pt-2 mt-1 flex flex-wrap gap-1.5">
          {sfStatuses.map(({ key, value }) => {
            const cfg = getStatusConfig(value);
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 ${cfg.bg} rounded px-2 py-1`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                <span className={`text-xs font-bold ${cfg.text}`}>{key}</span>
                <span className={`text-xs font-medium ${cfg.text}`}>{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

export default ClassCard;