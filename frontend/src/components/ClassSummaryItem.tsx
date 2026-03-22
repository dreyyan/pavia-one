import { useEffect, useState } from "react";

interface ClassSummaryItemProps {
  iconSrc?: string;
  text: string;
  value: number;
  maxValue?: number;
}

const ClassSummaryItem: React.FC<ClassSummaryItemProps> = ({ iconSrc, text, value = 0, maxValue = 100 }) => {
  const [progress, setProgress] = useState(0);

  // Compute progress dynamically
  useEffect(() => {
    let computedProgress = value;

    if (maxValue) {
      // value is absolute number, calculate percentage
      computedProgress = (value / maxValue) * 100;
    }

    // Clamp between 0-100
    computedProgress = Math.min(Math.max(computedProgress, 0), 100);

    // Animate to new progress
    const timeout = setTimeout(() => setProgress(computedProgress), 100);
    return () => clearTimeout(timeout);
  }, [value, maxValue]);

  return (
    <div className="flex justify-between bg-[var(--color-primary-700)] rounded-lg overflow-hidden">
      {/* [LEFT] Field */}
      <div className="flex-1">
        <div className="flex gap-x-2 px-3 py-[10px]">
          {/* Icon */}
          {iconSrc && (
            <div className="bg-[var(--color-primary-700)] rounded-l-sm">
              <img src={iconSrc} alt="icon" className="size-6" />
            </div>
          )}

          {/* Text */}
          <h3 className="text-[var(--color-text-50)] leading-0">{text}</h3>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[var(--color-bg-300)]">
          <div
            className="h-2 bg-[var(--color-primary-600)] rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* [RIGHT] Value */}
      <div className="flex items-center bg-[var(--color-bg-50)] border-3 border-[var(--color-primary-700)] rounded-r-lg px-2 py-1">
        <h2>{maxValue ? `${value}/${maxValue}` : `${value}%`}</h2>
      </div>
    </div>
  );
};

export default ClassSummaryItem;