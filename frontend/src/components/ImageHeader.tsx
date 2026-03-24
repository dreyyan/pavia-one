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
            className="w-full bg-[var(--color-primary-700)] cursor-pointer hover:brightness-110 transition-all overflow-hidden"
        >
            {/* - Added 'px-4' for mobile padding
                - Added 'sm:py-12' to give it more height on desktop
            */}
            <div className="relative flex flex-col justify-center items-center pt-8 pb-10 px-4 sm:pt-12 sm:pb-14">
                
                {/* School Logo - Absolute Positioned
                    - Adjusted to 'size-12' on mobile and 'sm:size-20' on desktop
                    - Fixed positioning to stay in the corner or top
                */}
                <img 
                    src="/school.png" 
                    className="absolute top-4 right-4 size-12 sm:size-20 opacity-80 sm:opacity-100 aspect-square object-contain" 
                    alt="School Logo"
                />

                {/* Main Icons 
                    - Responsive sizing: 'size-24' on mobile, 'sm:size-36' on desktop
                */}
                <img 
                    src="/pavia-one-icon.svg" 
                    className="size-24 sm:size-36 mb-2" 
                    alt="PaviaOne Icon"
                />
                
                <img 
                    src="/pavia-one-text-white.svg" 
                    className="w-48 sm:w-64 h-auto" 
                    alt="PaviaOne Text"
                />

                {/* Tagline Container 
                    - 'max-w-prose' prevents the text from stretching too wide on desktop
                */}
                <div className="mt-4 max-w-xs sm:max-w-md px-4">
                    <h3 className="text-[var(--color-text-50)] text-center text-sm sm:text-lg font-medium leading-tight">
                        Your School's All-in-One Management Platform
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default ImageHeader;