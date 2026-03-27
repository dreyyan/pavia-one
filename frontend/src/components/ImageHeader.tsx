import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ImageHeader = () => {
    const navigate = useNavigate();

    // Preload images
    useEffect(() => {
        const images = ["/pavia-one-icon.svg", "/pavia-one-text-white.svg", "/school.png"];
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    return (
        <div 
            onClick={() => navigate("/")} 
            className="group relative w-full flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--color-primary-800)]
                       min-h-[220px] sm:min-h-[300px] lg:min-h-[350px]" 
        >
            {/* 1. BACKGROUND IMAGE - Using absolute inset-0 to fill the min-h defined above */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/school.png" 
                    className="w-full h-full object-cover object-center opacity-70 transition-transform duration-700 group-hover:scale-105" 
                    alt="School Background"
                />
                {/* Dark overlay to make white text pop on any background */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors" />
            </div>

            {/* 2. CONTENT LAYER - Using z-10 to stay above the image */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
                
                {/* Icon Sizing: Responsive for split screens */}
                <img 
                    src="/pavia-one-icon.svg" 
                    className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mb-4 drop-shadow-xl" 
                    alt="PaviaOne Icon"
                />
                
                {/* Text Logo Sizing */}
                <img 
                    src="/pavia-one-text-white.svg" 
                    className="w-40 sm:w-56 lg:w-64 h-auto drop-shadow-lg" 
                    alt="PaviaOne Text"
                />

                {/* Tagline */}
                <div className="mt-4 max-w-[250px] sm:max-w-md">
                    <h3 className="text-white text-xs sm:text-base lg:text-lg font-medium leading-tight drop-shadow-md">
                        Your School's All-in-One Management Platform
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default ImageHeader;