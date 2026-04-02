import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PrimaryButton from "./PrimaryButton";

const images = [
  "/carousel-1.png",
  "/carousel-2.png",
  "/carousel-3.png"
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
    title: "Official DepEd School Forms Management",
    description:
      "Generate, manage, and maintain official DepEd school forms such as SF1, SF5, SF9, and SF10 with accuracy, consistency, and compliance.",
  },
];

const FeaturesCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsLoading(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdviserLogin = () => navigate("/login/adviser");
  const handleAdminLogin = () => navigate("/login/admin");
  const handleNextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsLoading(true);
  };
  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsLoading(true);
  };

  useEffect(() => {
    const img = new Image();
    img.src = images[(currentIndex + 1) % images.length];
  }, [currentIndex]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* flex-col for mobile, flex-row for md+, items centered for desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-12 lg:gap-16">
            
            {/* [COMPONENT] Carousel Image */}
            <div
            className="relative w-full md:w-1/2 min-w-[296px] aspect-[16/9] rounded-lg cursor-pointer overflow-hidden mt-0 md:mt-0 order-1 md:order-2"
            onClick={handleNextImage}
            >
            {/* Skeleton overlay */}
            {isLoading && (
                <div className="absolute inset-0 w-full min-w-[296px] bg-[var(--color-bg-200)] animate-pulse rounded-lg" />
            )}

            <img
                key={images[currentIndex]}
                src={images[currentIndex]}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                isLoading ? "opacity-0" : "opacity-100"
                }`}
            />

            {/* Dot Indicators */}
            <div className="absolute bottom-4 sm:bottom-5 flex left-1/2 transform -translate-x-1/2 space-x-2">
                {images.map((_, index) => (
                <div
                    key={index}
                    onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(index);
                    }}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full cursor-pointer transition-opacity ${
                    index === currentIndex
                        ? "bg-[var(--color-bg-50)]"
                        : "bg-[var(--color-bg-50)] opacity-50"
                    }`}
                />
                ))}
            </div>
            </div>

        {/* [SECTION] Text Content */}
        <div className="md:w-1/2 text-center md:text-left space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 order-2 md:order-1 mt-6 md:mt-0">
            <div className="min-h-[4rem] flex items-center justify-center md:justify-start">
                <h2 className="text-[var(--color-primary-700)] font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl leading-snug sm:leading-snug md:leading-snug">
                {content[currentIndex].title}
                </h2>
            </div>
            
            <p className="body-small text-sm sm:text-base md:text-lg lg:text-xl leading-snug sm:leading-snug md:leading-snug">
                {content[currentIndex].description}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 mt-2 md:mt-4">
                <PrimaryButton text="Login as Adviser" onClick={handleAdviserLogin} />
                <PrimaryButton text="Login as Admin" color="FCB103" onClick={handleAdminLogin} />
            </div>
        </div>
    </div>
    </div>
  );
};

export default FeaturesCarousel;