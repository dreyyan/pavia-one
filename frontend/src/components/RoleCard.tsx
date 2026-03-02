interface RoleCardProps {
    role: string;
    icon: string;
    onClick?: () => void;
}

const RoleCard = (props: RoleCardProps) => {
    return (
        <button onClick={props.onClick} className="flex flex-col justify-center items-center py-6 px-8 bg-[var(--color-primary-700)] rounded-md cursor-pointer hover:bg-[var(--color-primary-600)] transition">
            <img src={props.icon} loading="eager" className="size-21 mb-2" />
            <h3 className="text-white">{props.role}</h3>
        </button>
    );
};

export default RoleCard;