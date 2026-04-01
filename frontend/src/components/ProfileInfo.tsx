interface ProfileInfoProps {
  lastName: string;
  firstName: string;
  role?: string;
};

const ProfileInfo = ({ lastName, firstName, role }: ProfileInfoProps) => {
  return (
    <div className="bg-[var(--color-bg-100)] px-4 py-3 rounded-lg">
      <h2>{lastName ? (role ? lastName : `${lastName},`) : ""}</h2>
      {firstName && <p className="body-large">{firstName}</p>}
      {role && <p className="body-large">{role}</p>}
    </div>
  );
};

export default ProfileInfo;