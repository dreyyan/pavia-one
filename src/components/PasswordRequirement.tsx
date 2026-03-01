interface PasswordRequirementProps {
    requirement: string;
    isMet: boolean;
}

const PasswordRequirement = (props: PasswordRequirementProps) => {
    return (
        <div className="flex items-center gap-x-2">
            {/* Check Indicator */}
            <div className={`text-xs text-center text-[var(--color-text-50)] rounded-full border size-4 ${props.isMet ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)]" : "border-gray-300"}`}>
            </div>

            {/* Requirement */}
            <p className="label-caption text-[var(--color-text-600)]">{props.requirement}</p>
        </div>
    );
};

export default PasswordRequirement;