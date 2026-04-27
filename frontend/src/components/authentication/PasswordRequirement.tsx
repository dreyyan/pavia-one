interface PasswordRequirementProps {
    requirement: string;
    isMet: boolean;
}

const PasswordRequirement = (props: PasswordRequirementProps) => {
    return (
        <div className="flex items-center gap-x-2">
            {/* Check Indicator */}
            <div
            className={`flex items-center justify-center text-[10px] font-bold rounded-full border size-4
            ${props.isMet
                ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white"
                : "border-gray-300 text-transparent"
            }`}
            >
            ✓
            </div>

            {/* Requirement */}
            <p className="label-caption text-[var(--color-text-600)]">{props.requirement}</p>
        </div>
    );
};

export default PasswordRequirement;