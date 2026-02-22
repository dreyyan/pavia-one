import PrimaryButton from "./PrimaryButton";
import { useNavigate } from "react-router-dom";

const FeaturesCarousel = () => {
    const navigate = useNavigate();

    // Handles
    const handleStudentLogin = () => {
        navigate("/login");
    };

    const handleAdviserLogin = () => {
        navigate("/login");
    };

    return (
        <div>
            <div className="relative min-w-[312px] min-h-[312px] rounded-lg">
                {/* Skeleton Placeholder */}
                <div className="absolute inset-0 bg-[var(--color-bg-200)] rounded-lg animate-pulse" />

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <div className="w-3 h-3 bg-[var(--color-bg-50)] rounded-full"></div>
                    <div className="w-3 h-3 bg-[var(--color-bg-50)] rounded-full opacity-50"></div>
                    <div className="w-3 h-3 bg-[var(--color-bg-50)] rounded-full opacity-50"></div>
                </div>
            </div>
            
            {/* Carousel Content */}
            <div className="text-center pt-4 pb-8">
                <h2 className="text-[var(--color-primary-700)]">View Grades</h2>
                <p className="body-small">Access your academic records anytime.</p>
            </div>

            {/* Primary Buttons */}
            <div className="flex flex-col gap-y-2 mb-4">
                <PrimaryButton text="Login as Student" onClick={handleStudentLogin} />
                <PrimaryButton text="Login as Adviser" color="FCB103" onClick={handleAdviserLogin} />
            </div>

            <a href="" className="link block text-center underline text-[var(--color-primary-700)]">Learn More</a>
        </div>
    );
};

export default FeaturesCarousel;