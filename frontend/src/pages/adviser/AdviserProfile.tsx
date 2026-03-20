import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSkeleton from "../../components/DashboardSkeleton";

const AdviserProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = 4;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (!data.success) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setProfile(data.data);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/login/adviser");
    }
  }, [isAuthenticated, navigate]);

  if (loading || isAuthenticated === null) return <DashboardSkeleton />;

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="py-6 px-4 flex flex-col items-center">

      {/* Profile */}
      <div className="flex flex-col items-center mb-6">
        <h4 className="text-[var(--color-text-600)]">
          Welcome, Ma'am/Sir
        </h4>

        <h2>{profile?.name}</h2>

        <div className="bg-[var(--color-bg-300)] size-24 rounded-full my-4"></div>

        <h2>
          Grade {profile?.gradeLevel} - Section {profile?.sectionName}
        </h2>

        <h4>
          Class Adviser
        </h4>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[var(--color-bg-100)] border border-[var(--color-bg-300)] rounded-lg shadow-sm p-5 space-y-3">

        {currentPage === 1 && (
          <>
            <h2 className="text-[var(--color-primary-700)]">
              Basic Information
            </h2>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Full Name
              </p>
              <p className="body-large">{profile?.name}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Sex
              </p>
              <p className="body-large">{profile?.sex || "N/A"}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Date of Birth
              </p>
              <p className="body-large">{profile?.dateOfBirth || "N/A"}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Nationality
              </p>
              <p className="body-large">
                {profile?.nationality || "Filipino"}
              </p>
            </div>

            <button className="button mt-3 border border-[var(--color-primary-700)] text-[var(--color-primary-700)] px-3 py-1 rounded-md flex items-center gap-2 whitespace-nowrap">
            Edit
            <img src="/edit-icon.svg" alt="edit" className="w-4 h-4" />
          </button>  {/* idk paano change button colors */}
          </>
        )}

       {currentPage === 2 && (
          <>
            <h2 className="text-[var(--color-primary-700)]">
              Academic Information
            </h2>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Teacher ID
              </p>
              <p className="body-large">{profile?.teacherId || "N/A"}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Teacher Rank
              </p>
              <p className="body-large">{profile?.teacherRank || "N/A"}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Advisory Grade
              </p>
              <p className="body-large">{profile?.gradeLevel || "N/A"}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Section
              </p>
              <p className="body-large">{profile?.sectionName || "N/A"}</p>
            </div>

            <div>
              <p className="label-caption text-[var(--color-text-600)]">
                Date Hired
              </p>
              <p className="body-large">{profile?.dateHired || "N/A"}</p>
            </div>

            <button className="button mt-3 border border-[var(--color-primary-700)] text-[var(--color-primary-700)] px-3 py-1 rounded-md flex items-center gap-2 whitespace-nowrap">
            Edit
            <img src="/edit-icon.svg" alt="edit" className="w-4 h-4" />
            </button>  {/* idk paano change button colors */}
          </>
        )}

        {currentPage === 3 && (
            <>
              <h2 className="text-[var(--color-primary-700)]">
                Contact Information
              </h2>

              <div>
                <p className="label-caption text-[var(--color-text-600)]">
                  Email Address
                </p>
                <p className="body-large">
                  {profile?.email || "N/A"}
                </p>
              </div>

              <div>
                <p className="label-caption text-[var(--color-text-600)]">
                  Contact No.
                </p>
                <p className="body-large">
                  {profile?.contactNumber || "N/A"}
                </p>
              </div>

              <button className="button mt-3 border border-[var(--color-primary-700)] text-[var(--color-primary-700)] px-3 py-1 rounded-md flex items-center gap-2 whitespace-nowrap">
              Edit
              <img src="/edit-icon.svg" alt="edit" className="w-4 h-4" />
              </button>  {/* idk paano change button colors */}
            </>
          )}

        {currentPage === 4 && (
          <>
            <h2 className="text-[var(--color-primary-700)]">
              Account Information
            </h2>
            <p className="label-caption text-[var(--color-text-600)]">
              Coming soon
            </p>
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`px-2 rounded-full ${
            currentPage === 1
              ? "bg-[var(--color-bg-300)] text-[var(--color-text-500)]"
              : "bg-[var(--color-primary-700)] text-[var(--color-text-50)]"
          }`}
        >
          ‹
        </button>

        <div className="flex gap-2">
          {[1, 2, 3, 4].map((page) => (
            <span
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-2 h-2 rounded-full cursor-pointer ${
                currentPage === page
                  ? "bg-[var(--color-primary-700)]"
                  : "bg-[var(--color-bg-400)]"
              }`}
            ></span>
          ))}
        </div>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`px-2 rounded-full ${
            currentPage === totalPages
              ? "bg-[var(--color-bg-300)] text-[var(--color-text-500)]"
              : "bg-[var(--color-primary-700)] text-[var(--color-text-50)]"
          }`}
        >
          ›
        </button>
      </div>

      <p className="label-caption text-[var(--color-text-600)] mt-2">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
};

export default AdviserProfile;