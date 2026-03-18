import { useState } from "react";

interface ClassCardProps {
    id: number;
    name: string;
    schedule: { day: string; time: string }[];
    classSize: number;
    maleCount: number;
    femaleCount: number;
    color: string;
};

const MyClassCard: React.FC<ClassCardProps> = ({ id, name, schedule, classSize, maleCount, femaleCount, color }) => {
    return (
        <div
        key={id}
        style={{backgroundColor: color}}
        className="
            relative
            rounded-lg
            pt-4
            space-y-1
            shadow-md
        "
        >
            {/* Class Size Badge */}
            <div
                style={{ borderColor: color }}
                className="
                absolute top-[-16px] right-4
                flex items-center gap-1
                bg-[var(--color-bg-50)]
                border-3 rounded-sm
                px-2 py-1
                "
            >
                <p
                style={{ color: color }}
                className="font-roboto font-semibold text-sm text-[var(--color-primary-700)]">{classSize}</p>
                <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill={color}
                viewBox="0 0 24 24"
                stroke="none"
                >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            </div>

            <div className="px-4 pt-1 pb-2">
                {/* Class Section Name */}
                <h1 className="text-left text-[var(--color-text-50)] font-semibold">{name}</h1>

                {/* Class Schedule */}
                <div>
                    {schedule.map(({ day, time }, index) => (
                    <div key={index} className="flex justify-between [&>p]:text-[var(--color-text-50)]">
                        <p className="font-roboto font-bold text-sm leading-normal tracking-wider">{day}</p>
                        <p className="font-roboto font-medium text-sm leading-normal">{time}</p>
                    </div>
                    ))}
                </div>
            </div>

            {/* Class Size - Male & Female */}
            <div className="flex justify-end bg-[var(--color-bg-50)] px-3 rounded-b-lg">
                <span className="flex items-center">
                    <p className="font-roboto text-[15px] font-bold text-[var(--color-text-800)]">{maleCount}</p>
                    <img src="/male-icon.svg" className="size-5"/>
                </span>
                <p className="font-figtree font-semibold pb-1 text-[var(--color-text-800)]">&nbsp;|&nbsp;</p>
                <span className="flex items-center">
                    <p className="font-roboto text-[15px] font-bold text-[var(--color-text-800)]">{femaleCount}</p>
                    <img src="/female-icon.svg" className="size-5"/>
                </span>
            </div>
        </div>
    );
};

export default MyClassCard;