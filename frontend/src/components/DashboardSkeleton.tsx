const DashboardSkeleton = () => {
  return (
    <div className="py-6 px-4 space-y-6 animate-pulse">

      {/* Header */}
      <div className="bg-[var(--color-primary-700)] py-3 rounded-lg flex justify-center">
        <div className="h-6 w-40 bg-[var(--color-bg-300)] rounded" />
      </div>

      {/* Personal Information */}
      <div className="flex items-center bg-[var(--color-primary-600)] border-2 border-[var(--color-primary-700)]/60 rounded-xl px-5 py-6 gap-x-4 shadow-md">
        {/* Profile Picture */}
        <div className="bg-[var(--color-bg-200)] size-18 rounded-full flex-shrink-0" />
        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 bg-[var(--color-bg-300)] rounded" /> {/* Name */}
          <div className="h-4 w-32 bg-[var(--color-bg-300)] rounded" />  {/* Grade & Section */}
          <div className="h-3 w-24 bg-[var(--color-bg-300)] rounded" />  {/* Role */}
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 shadow-md">
        <div className="h-5 w-32 bg-[var(--color-bg-300)] rounded mb-4" /> {/* Overview Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-x-4">
            <div className="h-10 w-10 bg-[var(--color-bg-300)] rounded-full flex-shrink-0" /> {/* Icon */}
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24 bg-[var(--color-bg-300)] rounded" />
              <div className="h-3 w-16 bg-[var(--color-bg-300)] rounded" />
            </div>
          </div>
          <div className="flex items-center gap-x-4">
            <div className="h-10 w-10 bg-[var(--color-bg-300)] rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24 bg-[var(--color-bg-300)] rounded" />
              <div className="h-3 w-16 bg-[var(--color-bg-300)] rounded" />
            </div>
          </div>
          <div className="flex items-center gap-x-4">
            <div className="h-10 w-10 bg-[var(--color-bg-300)] rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24 bg-[var(--color-bg-300)] rounded" />
              <div className="h-3 w-16 bg-[var(--color-bg-300)] rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Buttons */}
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