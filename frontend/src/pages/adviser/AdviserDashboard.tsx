import DashboardButton from "../../components/DashboardButton";
import DashboardItem from "../../components/DashboardItem";
import { useState, useEffect } from "react";
import DashboardSkeleton from "../../components/DashboardSkeleton";

const AdviserDashboard = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/adviser/profile`,
            {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }
            );

            const data = await res.json();

            if (data.success) {
            setProfile(data.data);
            } else {
            console.error(data.message);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
        };

        fetchProfile();
    }, []);

    // const section = profile.sections?.[0];
    // const classSize = profile.students?.length ?? 0;
    if (loading) return <DashboardSkeleton />;

    return (
        <div className="py-6 px-4 space-y-4">
            <h1 className="text-[var(--color-text-950)]">Dashboard</h1>

            {/* [SECTION] Personal Information */}
            <div className="flex items-center bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-4 shadow-md">
                {/* Profile Image */}
                <div className="bg-[var(--color-bg-200)] size-18 rounded-full"></div>

                {/* Profile Details */}
                <div className="">
                    <h2 className="mb-2">John Doe</h2>
                    <p className="font-roboto font-semibold text-sm">Grade 10 - Section A</p>
                    <p className="font-roboto font-medium text-xs">Class Adviser</p>
                </div>
            </div>

            {/* [SECTION] Overview */}
            <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-lg px-5 py-6 gap-x-3 shadow-md">
                <h2 className="mb-3">Overview</h2>

                {/* Overview Details */}
                <div className="space-y-2">
                    <DashboardItem iconSrc="/class-size-icon.svg" text="Class Size" value={999}/>
                    <DashboardItem iconSrc="/present-today-icon.svg" text="Present Today" value={999}/>
                    <DashboardItem iconSrc="/pending-tasks-icon.svg" text="Pending Tasks" value={999}/>
                </div>
            </div>

            {/* [SECTION] Dashboard Buttons */}
            <div className="grid grid-cols-2 gap-6 px-4">
                <DashboardButton iconSrc="/view-students-icon.svg" text="View Students" color="#0066CC"/>
                <DashboardButton iconSrc="/attendance-icon.svg" text="Attendance" color="#28A428"/>
                <DashboardButton iconSrc="/grades-icon.svg" text="Grades" color="#CA8E02"/>
                <DashboardButton iconSrc="/reports-icon.svg" text="Reports" color="#8F28A4"/>
            </div>
        </div>
    );
};

export default AdviserDashboard;