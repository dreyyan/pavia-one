interface PasswordRequirementProps {
    requirement: string;
    isMet: boolean;
}

const PasswordRequirement = (props: PasswordRequirementProps) => {
    return (
        <div className="flex items-center gap-x-2">
            {/* Check Indicator */}
            <div className={`rounded-full border size-4 ${props.isMet ? "bg-green-500 border-green-500" : "border-gray-300"}`}>

            </div>

            {/* Requirement */}
            <p className="label-caption text-[var(--color-text-400)]">{props.requirement}</p>
        </div>
    );
};

export default PasswordRequirement;