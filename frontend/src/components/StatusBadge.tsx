export const StatusBadge = ({ status }: { status: string }) => {
  const color =
    status === "ENROLLED"
      ? "bg-green-100 text-green-700"
      : status === "DROPPED"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};