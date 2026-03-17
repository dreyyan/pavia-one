const DashboardSkeleton = () => {
  return (
    <div className="py-6 px-4 space-y-4 animate-pulse">

      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <div className="h-6 w-40 mx-auto bg-[var(--color-bg-300)] rounded" />
      </div>

      <div className="flex items-center bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-4 shadow-md">
        <div className="bg-[var(--color-bg-200)] size-18 rounded-full" />
        <div className="space-y-2 w-full">
          <div className="h-4 w-48 bg-[var(--color-bg-300)] rounded" />
          <div className="h-3 w-32 bg-[var(--color-bg-300)] rounded" />
          <div className="h-3 w-24 bg-[var(--color-bg-300)] rounded" />
        </div>
      </div>

      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-3 shadow-md">
        <div className="h-5 w-32 bg-[var(--color-bg-300)] rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--color-bg-300)] rounded" />
          <div className="h-4 w-full bg-[var(--color-bg-300)] rounded" />
          <div className="h-4 w-full bg-[var(--color-bg-300)] rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-4">
        <div className="h-24 bg-[var(--color-bg-300)] rounded-lg" />
        <div className="h-24 bg-[var(--color-bg-300)] rounded-lg" />
        <div className="h-24 bg-[var(--color-bg-300)] rounded-lg" />
        <div className="h-24 bg-[var(--color-bg-300)] rounded-lg" />
      </div>

    </div>
  );
};

export default DashboardSkeleton;