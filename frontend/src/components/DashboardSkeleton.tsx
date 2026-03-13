const DashboardSkeleton = () => {
  return (
    <div className="py-6 px-4 space-y-4 animate-pulse">

      {/* Title */}
      <div className="h-6 w-40 bg-[var(--color-bg-300)] rounded" />

      {/* Profile Card */}
      <div className="flex items-center gap-4 bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6">
        
        <div className="size-18 rounded-full bg-[var(--color-bg-300)]" />

        <div className="space-y-2 w-full">
          <div className="h-4 w-48 bg-[var(--color-bg-300)] rounded" />
          <div className="h-3 w-32 bg-[var(--color-bg-300)] rounded" />
          <div className="h-3 w-24 bg-[var(--color-bg-300)] rounded" />
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 space-y-3">
        <div className="h-5 w-32 bg-[var(--color-bg-300)] rounded" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--color-bg-300)] rounded" />
          <div className="h-4 w-full bg-[var(--color-bg-300)] rounded" />
          <div className="h-4 w-full bg-[var(--color-bg-300)] rounded" />
        </div>
      </div>

    </div>
  );
};

export default DashboardSkeleton;