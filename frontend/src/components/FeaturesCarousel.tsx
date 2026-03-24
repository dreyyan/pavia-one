// [IMPORT] Hooks
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
// [IMPORT] Components
import PrimaryButton from "./PrimaryButton";

const images = [
    "/carousel-1.webp",
    "/carousel-2.webp",
    "/carousel-3.webp"
];

const content = [
  {
    title: "Grades & Academic Performance Management",
    description:
      "Encode, update, and monitor student grades across subjects and grading periods with real-time insights and performance tracking.",
  },
  {
    title: "Class & Section Management",
    description:
      "Organize sections, manage class lists, monitor enrollment counts, and oversee academic structure efficiently.",
  },
  {
    title: "School Registers & Official Forms",
    description:
      "Digitally manage SF1, SF5, SF9, SF10 with accuracy and compliance.",
  },
];

const FeaturesCarousel = () => {
    const navigate = useNavigate();
    // [STATES]
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // [EFFECT] Auto change image display every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
            setIsLoading(true);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // [HANDLE] Navigation
    const handleAdviserLogin = () => navigate("/login/adviser");
    const handleAdminLogin = () => navigate("/login/admin");

    // [HANDLE] Navigate to next image
    const handleNextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsLoading(true);
    };

    // [HANDLE] Dot navigation
    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        setIsLoading(true);
    };

    return (
        <div className="w-full">
            {/* [COMPONENT] Carousel 
                Increased min-width and added 2xl:min-h to fill 1440px space better
            */}
            <div
                className="relative w-full aspect-square min-w-[312px] xl:min-w-[450px] 2xl:min-w-[550px] rounded-lg cursor-pointer overflow-hidden shadow-sm"
                onClick={handleNextImage}
            >
                {/* [COMPONENT] Skeleton */}
                {isLoading && (
                    <div className="absolute inset-0 bg-[var(--color-bg-200)] rounded-lg animate-pulse" />
                )}

                <img
                    key={images[currentIndex]}
                    src={images[currentIndex]}
                    alt="Feature"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(true)}
                    className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${
                        isLoading ? "opacity-0" : "opacity-100"
                    }`}
                />

                {/* [SECTION] Dot Indicators - Scaled up for Desktop */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation(); 
                                handleDotClick(index);
                            }}
                            className={`rounded-full transition-all cursor-pointer ${
                                index === currentIndex
                                    ? "bg-white w-4 h-4 shadow-md"
                                    : "bg-white opacity-50 w-3 h-3 hover:opacity-80"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* [SECTION] Carousel Content - Heavily scaled typography */}
            <div className="text-center pt-10 pb-6 space-y-4">
                <div className="min-h-[4rem] xl:min-h-[6rem] flex items-center justify-center">
                    {/* text-xl -> xl:text-4xl -> 2xl:text-5xl */}
                    <h2 className="text-[var(--color-primary-700)] font-bold text-xl xl:text-3xl 2xl:text-4xl tracking-tight leading-tight">
                        {content[currentIndex].title}
                    </h2>
                </div>
                {/* text-sm -> xl:text-lg -> 2xl:text-xl */}
                <p className="min-h-[4rem] text-gray-600 text-sm xl:text-lg 2xl:text-xl leading-relaxed max-w-[90%] mx-auto">
                    {content[currentIndex].description}
                </p>
            </div>

            {/* [SECTION] Primary Buttons - Side by Side with larger Gaps */}
            <div className="flex flex-col sm:flex-row gap-4 xl:gap-6 mt-6 mb-10">
                <div className="flex-1">
                    <PrimaryButton 
                        text="Login as Adviser" 
                        onClick={handleAdviserLogin} 
                    />
                </div>
                <div className="flex-1">
                    <PrimaryButton 
                        text="Login as Admin" 
                        color="FCB103" 
                        onClick={handleAdminLogin} 
                    />
                </div>
            </div>

            {/* [SECTION] Footer Link */}
            <div className="text-center">
                <a 
                    href="about-us" 
                    className="text-sm xl:text-lg font-semibold underline text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] transition-colors"
                >
                    Learn More
                </a>
            </div>
        </div>
    );
};

export default FeaturesCarousel;