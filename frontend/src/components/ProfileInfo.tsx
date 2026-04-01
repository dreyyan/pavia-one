interface ProfileInfoProps {
  lastName: string;
  firstName: string;
};

const ProfileInfo = ({ lastName, firstName }: ProfileInfoProps) => {
    return (
        <div className="bg-[var(--color-bg-100)] px-4 py-3 rounded-lg">
            <h2>{lastName},</h2>
            <p className="body-large">{firstName}</p>
        </div>
    );
};

export default ProfileInfo;