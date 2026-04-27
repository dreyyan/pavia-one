import InputField from "./toolbar/InputField";

export const WeightRow = ({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: string) => void;
  disabled: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-roboto text-[var(--color-text-900)]">{label}</span>
      <span className="text-xs font-roboto text-[var(--color-text-500)]">{hint}</span>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-24">
        <InputField
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          max={1}
          disabled={disabled}
          showClear={false}
        />
      </div>
      <span className="text-xs font-roboto text-[var(--color-text-500)] w-10 text-right flex-shrink-0">
        {value !== undefined ? `${Math.round(Number(value) * 100)}%` : "—"}
      </span>
    </div>
  </div>
);