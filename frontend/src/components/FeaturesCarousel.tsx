import PrimaryButton from "./PrimaryButton";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

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
      "Digitally manage SF2, SF9, attendance records, and other official school forms with accuracy and compliance.",
  },
];

const FeaturesCarousel = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Auto change every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
            setIsLoading(true);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Navigation handlers
    const handleAdviserLogin = () => navigate("/login/adviser");
    const handleAdminLogin = () => navigate("/login/admin");

    // Click to go to next image
    const handleNextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsLoading(true);
    };

    // Click dot to go to specific image
    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        setIsLoading(true);
    };

    return (
        <div>
            {/* Carousel */}
            <div
                className="relative min-w-[312px] min-h-[312px] rounded-lg cursor-pointer"
                onClick={handleNextImage} // click carousel to next
            >
                {/* Skeleton */}
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

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation(); // prevent carousel click
                                handleDotClick(index);
                            }}
                            className={`w-3 h-3 rounded-full transition-opacity cursor-pointer ${
                                index === currentIndex
                                    ? "bg-[var(--color-bg-50)]"
                                    : "bg-[var(--color-bg-50)] opacity-50"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Carousel Content */}
            <div className="text-center pt-4 pb-6 space-y-2">
                <div className="min-h-[4rem] flex items-center justify-center">
                    <h2 className="text-[var(--color-primary-700)]">{content[currentIndex].title}</h2>
                </div>
                <p className="min-h-[4rem] body-small">{content[currentIndex].description}</p>
            </div>

            {/* Primary Buttons */}
            <div className="flex flex-col gap-y-2 mb-4">
                <PrimaryButton text="Login as Adviser" onClick={handleAdviserLogin} />
                <PrimaryButton text="Login as Admin" color="FCB103" onClick={handleAdminLogin} />
                <a href="about-us" className="link block text-center underline text-[var(--color-primary-700)]">Learn More</a>
            </div>
        </div>
    );
};

export default FeaturesCarousel;