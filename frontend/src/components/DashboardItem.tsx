interface DashboardProps {
    iconSrc?: string;
    text: string;
    value: number;
    color?: string;
};

const DashboardItem: React.FC<DashboardProps> = ({iconSrc, text, value, color}) => {
    return (
        <div className="flex lg:flex-col items-center justify-between lg:items-start gap-x-2 lg:gap-4 bg-[var(--color-bg-50)] pr-4 lg:p-6 rounded-sm shadow-sm/10">
            <div className="flex items-center gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5 xl:gap-x-6">
                {/* Icon */}
                <div
                    className="
                        flex items-center justify-center
                        bg-[var(--color-primary-700)]
                        rounded-l-sm lg:rounded-full
                        p-2 sm:p-2.5 md:p-3 lg:p-3 xl:p-5
                        min-w-[40px] sm:min-w-[48px] md:min-w-[56px] lg:min-w-0
                        flex-shrink-0
                    "
                    style={{ backgroundColor: color || "var(--color-primary-700)" }}
                >
                    <img
                        src={iconSrc}
                        className="size-5 sm:size-7 md:size-9 lg:size-7 xl:size-8 2xl:size-9"
                    />
                </div>
                {/* Text */}
                <p className="font-roboto font-semibold text-md sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">{text}</p>
            </div>

            {/* Value */}
            <p className="text-[var(--color-text-900)] font-bold lg:font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">{value}</p>
        </div>
    );
};

export default DashboardItem;