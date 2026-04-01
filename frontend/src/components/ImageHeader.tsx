import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ImageHeader = () => {
    const navigate = useNavigate();

    // [HOOK] Preload images
    useEffect(() => {
        const images = ["/pavia-one-icon.svg", "/pavia-one-text-white.svg", "/school.png"];
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    return (
        <button
            onClick={() => navigate("/")}
            className="bg-[var(--color-primary-700)] cursor-pointer w-full"
        >
            {/* [CONTAINER] Header Wrapper */}
            <div className="relative flex flex-col justify-center items-center pt-6 pb-9 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14">
                
                {/* [IMAGE] Logo Icon */}
                <img
                    src="/pavia-one-icon.svg"
                    className="size-24 sm:size-28 md:size-32 lg:size-36"
                />

                {/* [IMAGE] Logo Text */}
                <img
                    src="/pavia-one-text-white.svg"
                    className="w-40 sm:w-48 md:w-56 lg:w-64 mt-1 sm:mt-2"
                />

                {/* [IMAGE] Background School */}
                <img
                    src="/school.png"
                    className="absolute top-0 left-0 w-full h-full object-cover opacity-80 pointer-events-none"
                />

                {/* [TEXT] Tagline */}
                <div className="px-6 sm:px-10 md:px-16 lg:px-20">
                    <h3 className="mt-4 text-[var(--color-text-50)] text-center text-sm sm:text-base md:text-lg lg:text-xl leading-snug">
                        Your School's All-in-One Management Platform
                    </h3>
                </div>
            </div>
        </button>
    );
};

export default ImageHeader;