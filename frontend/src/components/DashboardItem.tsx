interface DashboardProps {
    iconSrc?: string;
    text: string;
    value: number;
};

const DashboardItem: React.FC<DashboardProps> = ({iconSrc, text, value}) => {
    return (
        <div className="flex items-center justify-between gap-x-2 bg-[var(--color-bg-50)] pr-3 rounded-sm shadow-sm/10">
            <div className="flex items-center gap-x-2">
                {/* Icon */}
                <div className="p-2 bg-[var(--color-primary-700)] rounded-l-sm">
                    <img src={iconSrc} className="size-5"/>
                </div>
                {/* Text */}
                <h3>{text}</h3>
            </div>

            {/* Value */}
            <h2 className="text-[var(--color-text-900)]">{value}</h2>
        </div>
    );
};

export default DashboardItem;