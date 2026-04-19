interface ProfileInfoProps {
  lastName: string;
  firstName: string;
  role?: string;
};

const ProfileInfo = ({ lastName, firstName, role }: ProfileInfoProps) => {
  return (
    <div className="flex flex-col bg-[var(--color-bg-100)] px-4 py-3 rounded-lg">
      <span className="profile-last-name">{lastName ? (role ? lastName : `${lastName},`) : ""}</span>
      {firstName && <span className="profile-first-name">{firstName}</span>}
      {role && <span className="profile-role">{role}</span>}
    </div>
  );
};

export default ProfileInfo;