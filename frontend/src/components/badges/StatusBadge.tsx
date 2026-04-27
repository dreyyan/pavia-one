/* eslint-disable @typescript-eslint/no-explicit-any */
import Badge from "./Badge";

export const StatusBadge = ({ status }: { status: string }) => {
  const statusColorMap: Record<string, string> = {
    ENROLLED: "green",
    DROPPED: "red",
  };

  const color = statusColorMap[status] ?? "primary";

  return (
    <Badge
      label={status.charAt(0) + status.slice(1).toLowerCase()}
      color={color as any}
    />
  );
};