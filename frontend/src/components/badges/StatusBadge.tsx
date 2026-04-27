export const StatusBadge = ({ status }: { status: string }) => {
  const color =
    status === "ENROLLED"
      ? "bg-[var(--color-green-50)] text-[var(--color-green-600)] border border-[var(--color-green-200)]"
      : status === "DROPPED"
      ? "bg-[var(--color-red-50)] text-[var(--color-red-600)] border border-[var(--color-red-200)]"
      : "bg-[var(--color-bg-50)] text-[var(--color-text-600)] border border-[var(--color-bg-200)]";

  return (
    <span className={`px-2 py-0.5 text-xs md:text-sm font-semibold rounded-full ${color}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};