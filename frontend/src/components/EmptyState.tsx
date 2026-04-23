interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

const EmptyState = ({ title, subtitle }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-[var(--color-bg-100)] rounded-xl space-y-4 text-center">
      <img src="/no-data.svg" alt="Empty state" className="w-20 h-20" />
      <h3 className="text-lg font-bold text-[var(--color-text-700)]">{title}</h3>
      {subtitle && <p className="text-sm text-[var(--color-text-600)]">{subtitle}</p>}
    </div>
  );
};

export default EmptyState;