interface PageTitleProps {
    title: string;
};

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
    return (
      <div className="bg-[var(--color-primary-700)] py-2 rounded-lg">
        <h1 className="text-center text-[var(--color-text-50)]">{title}</h1>
      </div>
    );
};

export default PageTitle;